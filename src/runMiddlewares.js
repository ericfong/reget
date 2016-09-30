
export function isPromise(p) {
  return p && p.then
}

// wrap sync result to a promise like interface
class SyncPromise {
  constructor(result, error) {
    this.result = result
    this.error = error
    this.isFulfilled = true
  }
  then(onFulfilled, onRejected) {
    if (onRejected && this.error) {
      this.catch(onRejected)
    } else if (onFulfilled) {
      this.result = onFulfilled(this.result)
    }
    return this
  }
  catch(onRejected) {
    if (onRejected && this.error) {
      const errRet = onRejected(this.error)
      if (errRet !== undefined) {
        this.result = errRet
      }
    }
    return this
  }
}

function toPromise(result, error) {
  return isPromise(result) ? result : new SyncPromise(result, error)
}

export default function runMiddlewares(context, middlewares, i = 0) {
  const curMiddleware = middlewares[i]
  if (!curMiddleware) return new SyncPromise()

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
}
