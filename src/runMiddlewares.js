
export function isPromise(p) {
  return p && p.then
}

// wrap sync result to a promise like interface
class SyncPromise {
  constructor(value, error) {
    this.value = value
    this.error = error
    this.isFulfilled = true
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

export function toPromise(result, error) {
  return isPromise(result) ? result : new SyncPromise(result, error)
}

export default function runMiddlewares(context, middlewares, i = 0) {
  const curMiddleware = middlewares[i]
  if (!curMiddleware) return new SyncPromise(context)

  let result
  let error
  try {
    result = curMiddleware(context, function next () {
      return runMiddlewares(context, middlewares, i + 1)
    })
  } catch(err) {
    error = err
  }

  return toPromise(result, error)
  // fill result with original context, if undefined is return
  .then(newCtx => newCtx || context)
}
