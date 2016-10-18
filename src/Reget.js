import _ from 'lodash'
import stringify from 'querystring-stable-stringify'

import CacheStore from './CacheStore'
import createMiddlewares from './createMiddlewares'
import CallContext from './CallContext'

export function cacheMiddleware(ctx) {
  const {method, url, input, cache} = ctx
  if (method === 'GET') {
    ctx.status = 304
  } else if (method === 'PUT' || method === 'POST') {
    cache.set(url, input)
  }
}


export default class Reget {
  constructor({cache, middlewares, promises} = {}) {
    this.cache = cache || new CacheStore()
    this.middlewares = middlewares || createMiddlewares()
    this.promises = promises || {}
  }

  getUrl(pathname, query) {
    let url = pathname
    if (query) url += '?' + stringify(query)
    return url
  }

  ping() {
    console.warn('reget.ping is depreacted, please use reget.get')
  }

  get(pathname, query, {ifModifiedSince} = {}) {
    const url = this.getUrl(pathname, query)
    let value = this.cache.get(url)
    let promise

    // check and call load again, cachedDate is wait for push (reget.put and reget.post will also clean cachedDate to trigger load again)
    // console.log(pathname, cachedDate, ifModifiedSince)
    const cachedTime = this.cache.getCachedTime(url)
    if (!cachedTime || cachedTime < ifModifiedSince) {
      const option = {headers: {}}
      if (cachedTime) {
        option.ifModifiedSince = option.headers['If-Modified-Since'] = ifModifiedSince ? new Date(Math.max(cachedTime, ifModifiedSince)) : cachedTime
      }
      promise = this.reload(url, option)
      // use promise directly if load is sync
      if (promise.isFulfilled) {
        value = promise.value
      }
    }

    return value
  }

  load(url, option) {
    console.warn('reget.load is depreacted, please use reget.reload')
    return this.reload(url, option)
  }

  reload(url, option) {
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

  watch(key, fn) {
    const existBefore = this.cache.hasWatch(key)
    this.cache.watch(key, fn)
    if (!existBefore && this.cache.hasWatch(key)) {
      this.request({method: 'WATCH', url: key})
    }
  }

  unwatch(key, fn) {
    const unwatchedKeys = this.cache.unwatch(key, fn)
    _.each(unwatchedKeys, key => this.request({method: 'UNWATCH', url: key}))
  }

  wait() {
    return Promise.all(_.values(this.promises).concat(this.cache.wait()))
    .then(() => {
      return _.isEmpty(this.promises) && !this.cache.hasPendingEvent() ? true : this.wait()
    })
  }


  // use & request for middlewares
  use(mw) {
    this.middlewares.use(mw)
  }

  request(ctxData) {
    const ctx = new CallContext(ctxData)
    ctx.reget = this
    ctx.cache = this.cache
    return this.middlewares(ctx)
    .then(res => {
      const {url, method} = res
      let body = res && res.body
      if (method === 'GET') {
        if (res && res.status === 304) {
          // no change, cachedDates already set
          body = this.cache.get(url)
        } else {
          // simple data cache
          this.cache.set(url, body)
        }
        return body
      } else {
        // for PUT and POST, suppose the data for this url will be changed
        this.cache.invalidate(url, true)
        return body
      }
    })
  }


  // HTTP interface that call request
  put(url, input, option) {
    return this.request({...option, method: 'PUT', url, input})
  }
  post(url, input, option) {
    return this.request({...option, method: 'POST', url, input})
  }


  cache(url, body) {
    console.warn('reget.cache is depreacted, please use reget.cache.set')
    this.cache.set(url, body)
  }

  invalidate(urlPrefix) {
    console.warn('reget.invalidate is depreacted, please use reget.cache.invalidate')
    this.cache.set(urlPrefix, true)
  }

  createPinger() {
    console.error('reget.createPinger is depreacted. Please use AutoRunner')
  }

  onChange() {
    console.error('reget.onChange is depreacted')
  }
}
