import makeDebug from 'debug'
import _ from 'lodash'
import pathToRegexp from 'path-to-regexp'

import SyncPromise from './SyncPromise'

const log = makeDebug('reget')


function decode(val) {
  if (val) return decodeURIComponent(val)
}

export default function route(conf) {
  const {route, routeOption, ...rest} = conf
  // use falcor similar param spec
  // init re
  const re = (!route || route === '/') ? null : pathToRegexp(route, routeOption)
  // init methods
  const methods = _.mapKeys(rest, (v, k) => k.toUpperCase())
  log(`route ${route} re=${re}`)

  // koa-route like
  function routing(ctx, next) {
    // match
    const downstream = methods[ctx.method || 'GET']
    // log(`routeByObj downstream=${downstream}`)
    if (!downstream) return next()

    // match path
    const m = re.exec(ctx.path)
    log(`regexp ${ctx.path} ${re}`, m)
    if (m) {
      const args = m.slice(1).map(decode)
      ctx.routePath = route
      args.unshift(ctx)
      args.push(next)
      return SyncPromise.resolve(downstream.apply(ctx, args))
    }

    // miss
    return next()
  }
  routing.route = route
  routing.routeOption = routeOption
  Object.assign(routing, methods)
  return routing
}
