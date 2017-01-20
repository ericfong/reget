
export default class SyncPromise {
  isFulfilled = true

  constructor(value, error) {
    this.value = value
    this.error = error
  }

  then(onFulfilled, onRejected) {
    if (onRejected && this.error) {
      this.value = onRejected(this.error)
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
  if (SyncPromise.isThenable(result)) {
    if (error) {
      return Promise.reject(error)
    }
    return result
  } else {
    return new SyncPromise(result, error)
  }
}
