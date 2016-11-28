import Reget from './Reget'

export default class AutoRunner {
  constructor(reget, runHandler, {disableOnChange} = {}) {
    this.reget = reget

    for (const key of Object.keys(reget)) {
      // TODO can auto this?
      if (key === 'cache' || key === 'promises' || key === 'handler') continue
      this[key] = reget[key]
    }

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


for (const key of Object.getOwnPropertyNames(Reget.prototype)) {
  if (key === 'constructor' || key[0] === '_' || AutoRunner.prototype[key]) continue
  AutoRunner.prototype[key] = function() {
    return this.reget[key].apply(this.reget, arguments)
  }
}
