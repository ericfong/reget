import { EventEmitter } from 'events'
import _ from 'lodash'
import stringify from 'querystring-stable-stringify'

import MiddlewareManager from './MiddlewareManager'
import Pinger from './Pinger'

export function cacheMiddleware(ctx) {
  const {method, url, body} = ctx
  if (method === 'GET') {
    ctx.body = this.caches[url]
  } else {
    // console.log('CACHE SET', url, body, 'DEFAULT')
    this.caches[url] = body
  }
}


export default class Reget extends EventEmitter {
  constructor({caches} = {}) {
    super()
    this.caches = caches || {}

    // meta
    this.modifieds = {}
    this.promises = {}
    _.each(this.caches, (val, key) => {
      this.modifieds[key] = Date.now()
    })

    // change event debounce for 100ms
    this._emitChange = _.debounce(() => this.emit('change'), 100)

    this.middlewareManager = new MiddlewareManager()
  }

  getUrl(pathname, query) {
    let url = pathname
    if (query) url += '?' + stringify(query)
    return url
  }

  use(path, fn, opts) {
    this.middlewareManager.use(path, fn, opts)
  }

  ping({pathname, query, ifModifiedSince}) {
    const url = this.getUrl(pathname, query)
    const cache = this.caches[url]
    const modified = this.modifieds[url]

    // check and call load again, modified is wait for push (reget.put and reget.post will also clean modified to trigger load again)
    if (!modified) {
      const option = {headers: {}}
      if (modified) {
        option.ifModifiedSince = option.headers['If-Modified-Since'] = Math.max(modified, ifModifiedSince)
      }
      const result = this.load(url, option)
      // use result directly if load is sync
      if (result.isFulfilled) {
        return result.value
      }
    }

    return cache
  }

  get(pathname, query) {
    return this.ping({pathname, query})
  }

  load(url, option) {
    const runningPromise = this.promises[url]
    if (runningPromise) return runningPromise
    // request and record the created promise
    const createdPromise = this.promises[url] = this.request({...option, method: 'GET', url})
    return createdPromise
    .then(result => {
      delete this.promises[url]
      return result
    }, err => {
      delete this.promises[url]
      throw err
    })
  }

  request(ctx) {
    const {url, method} = ctx
    return this.middlewareManager.run(ctx)
    .then(res => {
      let body = res && res.body
      this.modifieds[url] = new Date()
      if (method === 'GET') {
        // if (data && data.$caches) {
        //   // key-value pair caches
        //   _.each(data.$caches, (subCache, subUrl) => {
        //     this.caches[subUrl] = subCache
        //     this.modifieds[subUrl] = new Date()
        //   })
        //   _.each(data.$cacheTimestamps, (timestamp, subUrl) => {
        //     this.modifieds[subUrl] = timestamp
        //   })
        // } else
        if (res && res.status === 304) {
          // no change, modifieds already set
          body = this.caches[url]
        } else {
          // simple data cache
          // console.log('CACHE SET', url, body, ctx)
          this.caches[url] = body
        }
        this._emitChange()
        return body
      } else {
        // for PUT and POST, suppose the data for this url will be changed
        this.invalidate(url)
        this._emitChange()
        return body
      }
    })
  }

  // write through cache functions
  put(url, body, option) {
    return this.request({...option, method: 'PUT', url, body})
  }
  post(url, body, option) {
    return this.request({...option, method: 'POST', url, body})
  }

  invalidate(urlPrefix) {
    this.modifieds = _.pickBy(this.modifieds, (val, key) => !_.startsWith(key, urlPrefix))
  }

  createPinger(handler) {
    return new Pinger(this, handler)
  }

  onChange(listener) {
    this.on('change', listener)
    return () => this.removeListener('change', listener)
  }
}
