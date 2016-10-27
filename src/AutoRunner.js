import Reget from './Reget'

export default class AutoRunner {
  constructor(reget, runHandler, {disableOnChange} = {}) {
    this.reget = reget
    this.runHandler = runHandler
    this.preferredDate = new Date()

    this._isRunOnChange = !disableOnChange
    this.run()
  }

  // extends Reget
  get(pathname, query, option) {
    const url = this.reget.getUrl(pathname, query)
    this.reget.watch(url, this._onChange)
    return this.reget.get(url, null, {ifModifiedSince: this.preferredDate, ...option})
  }

  // for cache.watch, has to be bind to this AutoRunner
  _onChange = (changes) => {
    // console.log('_onChange', this._isRunOnChange, changes)
    if (this._isRunOnChange) {
      this.run(null, changes)
    }
  }

  run(props, changes) {
    return this.runHandler(this, props, changes)
  }

  start() {
    this._isRunOnChange = true
    this.preferredDate = new Date()
  }

  stop() {
    this._isRunOnChange = false
    this.unwatch(this._onChange)
  }
}

// TODO how to automate this
['put', 'post', 'reload', 'request', 'watch', 'unwatch', 'getCache', 'setCache', 'invalidate'].forEach(key => {
  AutoRunner.prototype[key] = function() {
    return this.reget[key].apply(this.reget, arguments)
  }
})
