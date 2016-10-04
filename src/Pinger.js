
export default class Pinger {
  constructor(reget, handler) {
    this.reget = reget
    this.handler = handler

    this.createdAt = new Date()
    // wrap and only expore get function for isolation and more flexible
    this.wrappedReget = Object.create(this.reget)
    this.wrappedReget.get = (pathname, query) => {
      return this.reget.ping({
        pathname, query,
        ifModifiedSince: this.createdAt,
      })
    }
    this.ping()
  }

  ping() {
    return this.handler(this.wrappedReget)
  }

  start() {
    // should be push check. ping checking should be inside run
    this.removeListener = this.reget.onChange(() => {
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
