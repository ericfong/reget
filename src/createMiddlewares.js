import SyncPromise from './SyncPromise'
import CallContext from './CallContext'


function runMiddlewares(ctx, middlewares, i = 0) {
  const curMiddleware = middlewares[i]
  if (!curMiddleware) return new SyncPromise(ctx)

  let result
  let error
  try {
    result = curMiddleware(ctx, function next () {
      return runMiddlewares(ctx, middlewares, i + 1)
    })
  } catch(err) {
    error = err
  }

  return SyncPromise.resolve(result, error)
  // always use one and original ctx for all middlewares
  // .then(newCtx => newCtx || ctx)
}


export default function createMiddlewares(middlewares) {
  const middlewareArray = []

  const runner = function(ctxData) {
    const ctx = ctxData instanceof CallContext ? ctxData : new CallContext(ctxData)
    return runMiddlewares(ctx, middlewareArray)
    // always return the original ctx
    .then(() => ctx)
  }

  runner.use = function(fn) {
    if (!fn) return
    if (Array.isArray(fn)) {
      fn.forEach(f => middlewareArray.push(f))
    } else {
      middlewareArray.push(fn)
    }
  }

  if (middlewares) {
    runner.use(middlewares)
  }

  return runner
}
