import { EventEmitter } from 'events'
import _ from 'lodash'
import stringify from 'querystring-stable-stringify'

import Pinger from './Pinger'
import CallContext from './CallContext'

export function cacheMiddleware(ctx) {
  const {method, url, body, reget} = ctx
  if (method === 'GET') {
    ctx.body = reget.caches[url]
  } else {
    // console.log('CACHE SET', url, body, 'DEFAULT')
    reget.caches[url] = body
  }
}


export default class Reget extends EventEmitter {
  constructor({caches, middlewares} = {}) {
    super()
    this.middlewares = middlewares
    this.caches = caches || {}

    // meta
    this.modifieds = {}
    this.promises = {}
    _.each(this.caches, (val, key) => {
      this.modifieds[key] = Date.now()
    })
  }

  getUrl(pathname, query) {
    let url = pathname
    if (query) url += '?' + stringify(query)
    return url
  }

  ping({pathname, query, expectDate}) {
    const url = this.getUrl(pathname, query)
    const modified = this.modifieds[url]
    let cache = this.caches[url]
    let promise

    // check and call load again, modified is wait for push (reget.put and reget.post will also clean modified to trigger load again)
    if (!modified) {
      const option = {headers: {}}
      if (modified) {
        option.ifModifiedSince = option.headers['If-Modified-Since'] = modified
      }
      if (expectDate) {
        option.expectDate = expectDate
      }
      promise = this.load(url, option)
      // use promise directly if load is sync
      if (promise.isFulfilled) {
        cache = promise.value
      }
    }

    return {cache, promise}
  }

  get(pathname, query) {
    return this.ping({pathname, query}).cache
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

  wait() {
    return Promise.all(_.values(this.promises).concat(this._emitPromise))
    .then(() => {
      return _.isEmpty(this.promises) && !this._emitPromise ? true : this.wait()
    })
  }

  request(ctxData) {
    const ctx = new CallContext(ctxData)
    ctx.reget = this
    return this.middlewares(ctx)
    .then(res => {
      const {url, method} = res
      let body = res && res.body
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
          this.cache(url, body)
        }
        return body
      } else {
        // for PUT and POST, suppose the data for this url will be changed
        this.invalidate(url)
        this.emitChange()
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

  cache(url, body) {
    this.caches[url] = body
    this.modifieds[url] = new Date()
    this.emitChange()
  }

  invalidate(urlPrefix) {
    this.modifieds = _.pickBy(this.modifieds, (val, key) => !_.startsWith(key, urlPrefix))
  }

  createPinger(handler) {
    return new Pinger(this, handler)
  }

  emitChange() {
    // change event debounce for 100ms
    // this._emitChange = _.debounce(() => this.emit('change'), 100)
    if (this._emitPromise) return
    this._emitPromise = new Promise(resolve => {
      setTimeout(() => resolve(), 100)
    }).then(() => {
      delete this._emitPromise
      this.emit('change')
    })
  }

  onChange(listener) {
    this.on('change', listener)
    return () => this.removeListener('change', listener)
  }
}
