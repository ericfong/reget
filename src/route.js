import makeDebug from 'debug'
import _ from 'lodash'
import pathToRegexp from 'path-to-regexp'

import SyncPromise from './SyncPromise'

const log = makeDebug('reget:route')


function decode(val) {
  if (val) return decodeURIComponent(val)
}

let deprecateWarned = false

export default function route(conf) {
  const {route, routeOption, ...rest} = conf
  // use falcor similar param spec
  // init re
  const reKeys = []
  const re = (!route || route === '/') ? null : pathToRegexp(route, reKeys, routeOption)
  // init methods
  const methods = _.mapKeys(rest, (v, k) => k.toUpperCase())
  log(`route ${route} re=${re}`)

  if (!deprecateWarned && reKeys.length > 0) {
    deprecateWarned = true
    console.warn(`Won't fill params "${reKeys.map(key => key.name)}" values into middleware function arguments in next version. Please make sure ${route} use ctx.params instead`)
  }

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

      ctx.routePath = ctx.routePath ? `${ctx.routePath}/${route}` : route
      ctx.params = ctx.params || {}
      for (let len = args.length, i=0; i<len; i++) {
        if (reKeys[i]) {
          ctx.params[reKeys[i].name] = args[i]
        }
      }

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
