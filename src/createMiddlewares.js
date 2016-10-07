import _ from 'lodash'
import pathToRegexp from 'path-to-regexp'

import SyncPromise from './SyncPromise'
import CallContext from './CallContext'


function decode(val) {
  if (val) return decodeURIComponent(val)
}

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
  // fill result with original ctx, if undefined is return
  .then(newCtx => newCtx || ctx)
}


export default function createMiddlewares() {
  const middlewareArray = []

  const runner = function(ctxData) {
    const ctx = ctxData instanceof CallContext ? ctxData : new CallContext(ctxData)
    return runMiddlewares(ctx, middlewareArray)
  }

  runner.use = function(pathPattern, fn, opts) {
    if (typeof pathPattern !== 'string') {
      fn = pathPattern
      pathPattern = '/'
    }

    if (pathPattern === '/') {
      middlewareArray.push(fn)
    } else {
      const re = pathToRegexp(pathPattern, opts)
      middlewareArray.push(function(ctx, next) {
        // match path
        const m = re.exec(ctx.path)
        // console.log('match', pathPattern, ctx, m)
        if (m) {
          const args = m.slice(1).map(decode)
          ctx.routePath = pathPattern
          args.unshift(ctx)
          args.push(next)
          return SyncPromise.resolve(fn.apply(ctx, args))
        }

        // miss
        return next()
      })
    }
  }

  return runner
}
