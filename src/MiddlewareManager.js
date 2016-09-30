import _ from 'lodash'
import pathToRegexp from 'path-to-regexp'

import runMiddlewares, {toPromise} from './runMiddlewares'

/*
ctx schema = {
// req
  url,
  path,
  data,
  headers,
  ifModifiedSince,

// res
  body,
  status
}
*/

function decode(val) {
  if (val) return decodeURIComponent(val)
}

export default class MiddlewareManager {
  constructor(middlewares) {
    this.middlewares = middlewares || []
  }

  use(pathPattern, fn, opts) {
    if (typeof pathPattern !== 'string') {
      fn = pathPattern
      pathPattern = '/'
    }

    if (pathPattern === '/') {
      this.middlewares.push(fn)
    } else {
      const re = pathToRegexp(pathPattern, opts)
      this.middlewares.push(function(ctx, next) {
        // match url
        const m = re.exec(ctx.url)
        // console.log('match', pathPattern, ctx.url, m)
        if (m) {
          const args = m.slice(1).map(decode)
          ctx.routePath = pathPattern
          args.unshift(ctx)
          args.push(next)
          return toPromise(fn.apply(ctx, args))
        }

        // miss
        return next()
      })
    }
  }

  run(ctx) {
    ctx.status = 404
    _.defaults(ctx, {
      method: 'GET',
      // TODO determine and use only path or url
      path: ctx.url,
    })

    return runMiddlewares(ctx, this.middlewares)
  }
}
