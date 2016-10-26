import _ from 'lodash'

import SyncPromise from './SyncPromise'
import toMiddleware from './toMiddleware'


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
}


export default function compose(...middlewareArrays) {
  const middlewares = []
  _.each(middlewareArrays, fn => {
    // if (!fn) return this
    if (Array.isArray(fn)) {
      fn.forEach(f => middlewares.push(toMiddleware(f)))
    } else {
      middlewares.push(toMiddleware(fn))
    }
  })

  function composing(ctx, next) {
    return runMiddlewares(ctx, middlewares)
    .then(next)
  }
  composing.middlewares = middlewares
  return composing
}
