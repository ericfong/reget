import { EventEmitter } from 'events'
import _ from 'lodash'
import stringify from 'querystring-stable-stringify'

import runMiddlewares from './runMiddlewares'


function getUrl(pathname, query) {
  let url = pathname
  if (query) url += '?' + stringify(query)
  return url
}

function isPromise(p) {
  return p && p.then
}


class Runner {
  isGreedy = false
  constructor(reget, func) {
    this.reget = reget
    this.func = func
    this.runDebounce = _.debounce(this.run, 10)
  }
  run = (isGreedy) => {
    if (this.isGreedy || isGreedy) {
      this.reget.setGreedy(true)
    }
    const ret = this.func()
    this.reget.setGreedy(false)
    this.isGreedy = false
    return ret
  }
  runNext(isGreedy) {
    if (isGreedy) this.isGreedy = true
    this.runDebounce()
  }
  listen() {
    this.removeListener = this.reget.onChange(this.runDebounce)
  }
  unlisten() {
    if (this.removeListener) this.removeListener()
  }
}


export default class Reget extends EventEmitter {
  middlewares = []

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

    this.use(this.baseMiddleware.bind(this))
  }

  use(middleware) {
    this.middlewares.push(middleware)
  }

  baseMiddleware({method, url, body}) {
    // console.log('baseMiddleware', ctx)
    if (method === 'PUT' || method === 'POST') {
      this.caches[url] = body
    }
  }

  setGreedy(isGreedy) {
    this.isGreedy = isGreedy
  }

  get(pathname, query) {
    const url = getUrl(pathname, query)
    const cache = this.caches[url]
    const modified = this.modifieds[url]

    // NOTE check and call load again
    // modified is wait for push (reget.put and reget.post will also clean modified to trigger load again)
    // isGreedy is force ping (used in componentWillMount and componentWillReceiveProps to force load data)
    if (!modified || this.isGreedy) {
      const option = {headers: {}}
      if (modified) {
        option.headers['If-Modified-Since'] = modified
        option.ifModifiedSince = modified
      }
      const result = this.load(url, option)
      // use result directly if load is sync
      if (!isPromise(result)) {
        return result
      }
    }

    return cache
  }

  load(url, option) {
    // check promise is running
    const result = this.promises[url]
    if (result) {
      return result
    }

    this.promises[url] = result
    return this.request({...option, method: 'GET', url})
    .then(result => {
      delete this.promises[url]
      return result
    }, err => {
      delete this.promises[url]
      throw err
    })
  }

  request(ctx) {
    _.defaults(ctx, {method: 'GET'})
    const {url, method} = ctx

    return runMiddlewares(ctx, this.middlewares)
    .then(res => {
      let body = res && res.body
      this.modifieds[url] = new Date()
      if (method === 'GET' || method === 'HEAD') {
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
          this.caches[url] = body
        }
        this._emitChange()
        return body
      } else {
        // for PUT and POST, suppose the data for this url will be changed
        delete this.modifieds[url]
        this._emitChange()
        return body
      }
    })
  }

  // write through cache functions
  put(url, body, option) {
    return this.request({...option, method: 'PUT', url, body})
    .then(result => {
      this.invalidate(url)
      return result
    })
  }
  post(url, body, option) {
    return this.request({...option, method: 'POST', url, body})
    .then(result => {
      this.invalidate(url)
      return result
    })
  }

  invalidate(urlPrefix) {
    this.modifieds = _.mapValues(this.modifieds, (val, key) => _.startsWith(key, urlPrefix))
  }

  createRunner(func) {
    return new Runner(this, func)
  }

  onChange(listener) {
    this.on('change', listener)
    return () => this.removeListener('change', listener)
  }
}
