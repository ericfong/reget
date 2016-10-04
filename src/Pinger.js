
export default class Pinger {
  constructor(reget, handler) {
    this._oriReget = reget
    this.handler = handler

    this.pingStartAt = new Date()
    // wrap and only expore get function for isolation and more flexible
    this.reget = Object.create(this._oriReget)
    this.reget.get = (pathname, query) => {
      return this._oriReget.ping({
        pathname, query,
        pingStartAt: this.pingStartAt,
      })
    }
    this.ping()
  }

  ping(props) {
    return this.handler(this.reget, props)
  }

  start() {
    this.pingStartAt = new Date()
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
