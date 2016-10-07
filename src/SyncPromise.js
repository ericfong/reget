
export default class SyncPromise {
  isFulfilled = true

  constructor(value, error) {
    this.value = value
    this.error = error
  }

  then(onFulfilled, onRejected) {
    if (onRejected && this.error) {
      this.value = onRejected(this.value)
    } else if (onFulfilled) {
      this.value = onFulfilled(this.value)
    }
    return this
  }

  catch(onRejected) {
    if (onRejected && this.error) {
      this.value = onRejected(this.error)
    }
    return this
  }
}

SyncPromise.isThenable = function(p) {
  return p && p.then
}

SyncPromise.resolve = function(result, error) {
  return SyncPromise.isThenable(result) ? result : new SyncPromise(result, error)
}
