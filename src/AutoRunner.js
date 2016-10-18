import Reget from './Reget'

export default class AutoRunner extends Reget {
  constructor(oriReget, handler, disableRunOnChange) {
    super(oriReget)

    this._oriReget = oriReget
    this.handler = handler
    this.preferredDate = new Date()

    this._isRunOnChange = !disableRunOnChange
    this.run()
  }

  // extends Reget
  get(pathname, query, option) {
    const url = this.getUrl(pathname, query)
    this.watch(url, this._onChange)
    return super.get(url, null, {ifModifiedSince: this.preferredDate, ...option})
  }

  // for cache.watch, has to be bind to this AutoRunner
  _onChange = (changes) => {
    if (this._isRunOnChange) {
      this.run(null, changes)
    }
  }

  run(props, changes) {
    return this.handler(this, props, changes)
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
