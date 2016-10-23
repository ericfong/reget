import _ from 'lodash'
import stringify from 'querystring-stable-stringify'

import CacheStore from './CacheStore'
import CallContext from './CallContext'


export default class Reget {
  constructor({cache, handler, promises} = {}) {
    this.cache = cache || new CacheStore()
    this.promises = promises || {}
    if (handler) {
      this.handler = handler
    }
  }

  getUrl(pathname, query) {
    let url = pathname
    if (query) url += '?' + stringify(query)
    return url
  }

  get(pathname, query, {ifModifiedSince} = {}) {
    const url = this.getUrl(pathname, query)
    let value = this.cache.get(url)
    let promise

    // check and call load again, cachedDate is wait for push (reget.put and reget.post will also clean cachedDate to trigger load again)
    const cachedTime = this.cache.getCachedTime(url)
    // console.log('>>>', pathname, !cachedTime || cachedTime < ifModifiedSince, cachedTime, ifModifiedSince)
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

  invalidate(key, allSuffix) {
    this.cache.invalidate(key, allSuffix)
  }

  // load(url, option) {
  //   console.warn('reget.load is depreacted, please use reget.reload')
  //   return this.reload(url, option)
  // }

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
  // use(mw) {
  //   console.warn('reget.use is depreacted, please use reget.handler')
  // }

  request(ctxData) {
    if (!this.handler) {
      console.error('Please setup reget.handler to handle GET, PUT, POST, WATCH, UNWATCH calls')
      return Promise.resolve()
    }
    const ctx = new CallContext(ctxData)
    ctx.reget = this
    ctx.cache = this.cache
    return this.handler(ctx)
    .then(() => {
      const {url, method, status, body} = ctx
      if (method === 'GET') {
        if (status === 304) {
          // no change, cachedDates already set
          return this.cache.get(url)
        }
        this.cache.set(url, body)
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
}
