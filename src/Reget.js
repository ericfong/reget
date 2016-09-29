import { EventEmitter } from 'events'
import _ from 'lodash'
import stringify from 'querystring-stable-stringify'


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
  constructor(props) {
    super()
    this.caches = props.caches || {}

    // meta
    this.modifieds = {}
    this.promises = {}
    _.each(this.caches, (val, key) => {
      this.modifieds[key] = Date.now()
    })

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
    let result = this.promises[url]
    if (result) {
      return result
    }
    // no promise is running, call request
    result = this.request(url, option)
    // request may be sync or async (promise)
    if (isPromise(result)) {
      // result is promise
      this.promises[url] = result
      result.then(ret => {
        delete this.promises[url]
        return ret
      }).catch(err => {
        delete this.promises[url]
        throw err
      })
    } else {
      delete this.promises[url]
    }
    return result
  }

  request(url, option = {}) {
    _.defaults(option, {method: 'GET'})
    const optionMethod = option.method
    const response = this.fetch(url, option)

    this.modifieds[url] = new Date()
    let postResponse
    if (optionMethod === 'GET' || optionMethod === 'HEAD') {
      postResponse = data => {
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
        if (data && data.status === 304) {
          // no change, modifieds already set
          data = this.caches[url]
        } else {
          // simple data cache
          this.caches[url] = data
        }
        this._emitChange()
        return data
      }
    } else {
      postResponse = data => {
        // for PUT and POST, suppose the data for this url will be changed
        delete this.modifieds[url]
        this._emitChange()
        return data
      }
    }
    if (isPromise(response)) {
      return response.then(postResponse)
    } else {
      return postResponse(response)
    }
  }

  // write through cache functions
  async put(url, body) {
    const ret = await this.request(url, {method: 'PUT', body})
    this.invalidate(url)
    return ret
  }
  async post(url, body) {
    const ret = await this.request(url, {method: 'POST', body})
    this.invalidate(url)
    return ret
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
