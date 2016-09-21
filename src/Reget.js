import { EventEmitter } from 'events'
import _ from 'lodash'
import stringify from 'querystring-stable-stringify'


function getUrl(pathname, query) {
  let url = pathname
  if (query) url += '?' + stringify(query)
  return url
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
  constructor(props) {
    super()
    this.caches = props.caches || {}

    // meta
    this.times = {}
    this.promises = {}
    _.each(this.caches, (val, key) => {
      this.times[key] = Date.now()
    })

    // this must larger then debounce value to prevent deadloop
    this.ttl = props.ttl || 60 * 1000
    this.fetch = props.fetch

    // change event debounce for 100ms
    this._emitChange = _.debounce(() => this.emit('change'), 100)
  }

  setGreedy(isGreedy) {
    this.isGreedy = isGreedy
  }

  get(pathname, query) {
    const url = getUrl(pathname, query)
    const cache = this.caches[url]
    const time = this.times[url]

    if ((!time || Date.now() - time > this.ttl) && !this.promises[url]) {
      const option = {
        headers: {},
        isGreedy: this.isGreedy,
      }
      if (time) {
        option.headers['If-Modified-Since'] = time
        option.ifModifiedSince = time
      }
      const result = this.load(url, option)
      // use result instead of cache when result is not a promise
      if (!(result && result.then)) {
        return result
      }
    }

    return cache
  }

  load(url, option) {
    const result = this.request(url, option)
    if (result && result.then) {
      // result is promise
      this.promises[url] = result
      result.then(ret => {
        delete this.promises[url]
        return ret
      }).catch(err => {
        delete this.promises[url]
        throw err
      })
    }
    return result
  }

  request(url, option = {}) {
    _.defaults(option, {method: 'GET'})
    const optionMethod = option.method
    const result = this.fetch(url, option)
    this.times[url] = new Date()
    const thenHandler = data => {
      if (optionMethod === 'GET' || optionMethod === 'HEAD') {
        if (data && data.$caches) {
          // key-value pair caches
          _.each(data.$caches, (subCache, subUrl) => {
            this.caches[subUrl] = subCache
            this.times[subUrl] = new Date()
          })
          _.each(data.$cacheTimestamps, (timestamp, subUrl) => {
            this.times[subUrl] = timestamp
          })
        } else if (data && data.status === 304) {
          // no change, times already set
          data = this.caches[url]
        } else {
          // simple data cache
          this.caches[url] = data
        }
      } else {
        // for PUT and POST, suppose the data for this url will be changed
        delete this.times[url]
      }
      this._emitChange()
      return data
    }
    if (result && result.then) {
      return result.then(thenHandler)
    } else {
      return thenHandler(result)
    }
  }

  // write through cache functions
  put(url, body) {
    return this.request(url, {method: 'PUT', body})
  }
  post(url, body) {
    return this.request(url, {method: 'POST', body})
  }

  invalidate(urlPrefix) {
    this.times = _.mapValues(this.times, (val, key) => _.startsWith(key, urlPrefix))
  }

  createRunner(func) {
    return new Runner(this, func)
  }

  onChange(listener) {
    this.on('change', listener)
    return () => this.removeListener('change', listener)
  }
}
