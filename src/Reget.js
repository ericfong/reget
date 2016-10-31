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

  getUrl(path, query) {
    let url = path
    if (query) url += '?' + stringify(query)
    return url
  }

  _shouldReload(option, cachedTime) {
    if (this.isServerPreloading) {
      // when isServerPreloading, only load resource that is specified and once
      return option.serverPreload && !cachedTime
    }

    // check and call load again (reget.put and reget.post will also clean cachedTime and trigger load again)
    // console.log('>>>', url, cachedTime, ifModifiedSince)
    return !cachedTime || cachedTime < option.ifModifiedSince
  }

  get(path, query, option = {}) {
    const url = this.getUrl(path, query)

    const cachedTime = this.cache.getCachedTime(url)
    const {ifModifiedSince} = option
    if (this._shouldReload(option, cachedTime)) {
      if (!option.headers) option.headers = {}
      if (cachedTime) {
        option.cachedTime = cachedTime
        option.ifModifiedSince = option.headers['If-Modified-Since'] = ifModifiedSince ? new Date(Math.max(cachedTime, ifModifiedSince)) : cachedTime
      }
      option.url = url
      const promise = this.reload(path, query, option)
      // use promise directly if load is sync
      if (promise.isFulfilled) {
        return promise.value
      }
    }

    return this.cache.get(url)
  }

  // HTTP interface that call request
  reload(path, query, option = {}) {
    const url = option.url || this.getUrl(path, query)
    const runningPromise = this.promises[url]
    if (runningPromise) return runningPromise
    // request and record the created promise
    const createdPromise = this.promises[url] = this.request({
      method: 'GET',
      url,
      path,
      query,
      ...option,
    })
    if (option.serverPreload) {
      createdPromise.serverPreload = option.serverPreload
    }
    return createdPromise
    .then(result => {
      delete this.promises[url]
      return result
    }, err => {
      delete this.promises[url]
      throw err
    })
  }

  put(url, input, option) {
    return this.request({...option, method: 'PUT', url, input})
  }
  post(url, input, option) {
    return this.request({...option, method: 'POST', url, input})
  }

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

  serverRender(renderCallback) {
    this.isServerPreloading = true
    const output = renderCallback(this)

    // recursive renderCallback & promise.then (instead of recursive this.wait())
    const promise = this.getLoadingPromise()
    if (promise) {
      return promise.then(() => this.serverRender(renderCallback))
    }

    this.isServerPreloading = false
    return output
  }

  getLoadingPromise(key) {
    if (key) {
      return this.promises[key]
    }

    const loadingPromises = _.values(this.promises)

    // NOTE will not trigger onChange in server preload, should not consider cache.getPendingPromise()
    if (!this.isServerPreloading) {
      const cachePromise = this.cache.getPendingPromise()
      if (cachePromise) {
        loadingPromises.push(cachePromise)
      }
    }

    return loadingPromises.length > 0 ? Promise.all(loadingPromises) : null
  }

  wait() {
    const promise = this.getLoadingPromise()
    if (promise) {
      return promise.then(() => this.wait())
    }
  }


  // Cache related delegates
  watch(key, fn) {
    const existBefore = this.cache.hasWatch(key)
    this.cache.watch(key, fn)
    if (!existBefore) this.request({method: 'WATCH', url: key})
  }
  unwatch(key, fn) {
    // first argument can be AutoRunner._onChange / watcher function
    const unwatchedKeys = this.cache.unwatch(key, fn)
    _.each(unwatchedKeys, key => this.request({method: 'UNWATCH', url: key}))
  }
  getCache() {
    const cache = this.cache
    return cache.get.apply(cache, arguments)
  }
  setCache() {
    const cache = this.cache
    return cache.set.apply(cache, arguments)
  }
  invalidate(key, allSuffix) {
    this.cache.invalidate(key, allSuffix)
  }
}
