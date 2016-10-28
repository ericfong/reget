import _ from 'lodash'

const oneMinute = 60 * 1000

// CacheStore that with maxAge and can watch cache changes
export default class CacheStore {
  cachedTimes = {}
  watcherLists = {}

  constructor({maxAge} = {}) {
    this.store = {}
    this.maxAge = maxAge || oneMinute
  }


  // get, set, invalidate
  get(key) {
    if (!key) return this.store
    return this.store[key]
  }

  getCachedTime(key) {
    return this.cachedTimes[key]
  }

  set(key, value) {
    if (typeof key === 'object') {
      Object.assign(this.store, key)
      for (const k in key) {
        const time = this.cachedTimes[k] = new Date()
        this._emitChange(key, time)
      }
    } else {
      this.store[key] = value
      const time = this.cachedTimes[key] = new Date()
      this._emitChange(key, time)
    }
  }

  invalidate(key, allSuffix) {
    if (allSuffix) {
      const removeds = {}
      this.cachedTimes = _.pickBy(this.cachedTimes, (date, k) => {
        if (_.startsWith(k, key)) {
          removeds[k] = date
          return false
        }
        return true
      })
      this._emitChange(removeds)
    } else if (key) {
      this._emitChange(key, this.cachedTimes[key])
      delete this.cachedTimes[key]
    } else {
      this._emitChange(this.cachedTimes)
      this.cachedTimes = {}
    }
  }


  // watch, unwatch, unwatchBy
  watch(key, fn) {
    // make sure unique, remove all previous registered listeners
    this.unwatch(key, fn)

    if (!this.watcherLists[key]) this.watcherLists[key] = [fn]
    else this.watcherLists[key].push(fn)
  }

  hasWatch(key) {
    return !!this.watcherLists[key]
  }

  unwatch(key, fn) {
    const unwatchedKeys = []
    if (typeof key === 'function') {
      // first argument can be AutoRunner._onChange / watcher function
      const _fn = key
      for (const key in this.watcherLists) {
        const newWatchers = this.watcherLists[key] = _.filter(this.watcherLists[key], w => w !== _fn)
        if (newWatchers.length === 0) {
          delete this.watcherLists[key]
          unwatchedKeys.push(key)
        }
      }
    } else {
      if (!this.watcherLists[key]) return this
      if (!fn) {
        delete this.watcherLists[key]
        return this
      }

      const newWatchers = this.watcherLists[key] = _.filter(this.watcherLists[key], w => w !== fn)
      if (newWatchers.length === 0) {
        delete this.watcherLists[key]
        unwatchedKeys.push(key)
      }
    }
    return unwatchedKeys
  }


  // emit changes, wait
  _emitChanges = {}
  _emitChange(key, time) {
    if (typeof key === 'object') {
      Object.assign(this._emitChanges, key)
    } else {
      this._emitChanges[key] = time
    }

    // use promise to debounce
    if (this._pendingPromise) return
    this._pendingPromise = new Promise(resolve => setTimeout(resolve, 1))
    .then(() => {
      this._pendingPromise = null
      const changes = this._emitChanges
      this._emitChanges = {}

      // only emit key that is changed
      // collect watchers
      let watcherList = []
      for (const k in changes) {
        if (this.watcherLists[k]) {
          watcherList = watcherList.concat(this.watcherLists[k])
        }
      }
      watcherList = _.uniq(watcherList)
      for (const fn of watcherList) {
        fn(changes)
      }

      // random call prune
      if (Math.random() < 0.1) {
        setTimeout(this.prune, 1)
      }
    })
  }

  getPendingPromise() {
    return this._pendingPromise
  }


  // prune
  prune() {
    // TODO consider aggressive all keys without listeners
    const expiredAt = Date.now() - this.maxAge
    // only keep cachedTimes which is larger then expiredAt
    this.cachedTimes = _.pickBy(this.cachedTimes, time => time > expiredAt)
    // only keep store which has cachedTimes
    this.store = _.pickBy(this.store, (value, k) => this.cachedTimes[k] || this.watcherLists[k])
  }
}
