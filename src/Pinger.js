
export default class Pinger {
  constructor(oriReget, handler) {
    this._oriReget = oriReget
    this.handler = handler

    this.expectDate = new Date()
    // wrap and only expore get function for isolation and more flexible
    this.reget = Object.create(oriReget)
    this.reget.get = (pathname, query) => {
      return oriReget.ping({pathname, query, expectDate: this.expectDate}).cache
    }
    this.reget.getPromise = (pathname, query) => {
      const {cache, promise} = oriReget.ping({pathname, query, expectDate: this.expectDate})
      return promise || Promise.resolve(cache)
    }
    this.ping()
  }

  ping(props) {
    return this.handler(this.reget, props)
  }

  start() {
    this.expectDate = new Date()
    // should be push check. ping checking should be inside run
    this.removeListener = this._oriReget.onChange(() => {
      // only run if still listening
      if (this.removeListener) {
        this.ping()
      }
    })
    return this
  }
  stop() {
    if (this.removeListener) this.removeListener()
    return this
  }
}
