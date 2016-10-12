import pathToRegexp from 'path-to-regexp'

import SyncPromise from './SyncPromise'


function decode(val) {
  if (val) return decodeURIComponent(val)
}

function route(pathPattern, fn, opts) {
  const re = pathToRegexp(pathPattern, opts)
  return function(ctx, next) {
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
  }
}

export default route
