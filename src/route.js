import _ from 'lodash'
import makeDebug from 'debug'
import pathToRegexp from 'path-to-regexp'

import SyncPromise from './SyncPromise'

const log = makeDebug('reget')


function decode(val) {
  if (val) return decodeURIComponent(val)
}

function routeByObj(obj) {
  const methods = _.mapKeys(obj, (v, k) => k.toUpperCase())
  return function() {
    const ctx = arguments[0]
    const next = arguments[arguments.length - 1]
    const downstream = methods[ctx.method]
    // log(`routeByObj downstream=${downstream}`)
    if (!downstream) return next()
    return SyncPromise.resolve(downstream.apply(ctx, arguments))
  }
}

function route(pathPattern, fn, opts) {
  // first arg is not pathPattern
  const pathPatternType = typeof pathPattern
  if (pathPatternType === 'function') {
    return pathPattern
  } else if (pathPatternType === 'object') {
    return routeByObj(pathPatternType)
  }

  const downstream = typeof fn === 'object' ? routeByObj(fn) : fn

  // pathPattern is match all
  if (!pathPattern || pathPattern === '/') {
    return downstream
  }

  // // must starting with / according to pathToRegexp, koa-mount and koa-route
  // if (pathPattern[0] !== '/') {
  //   pathPattern = `/${pathPattern}`
  // }


  // pathToRegexp
  const regExpParams = []
  const re = pathToRegexp(pathPattern, regExpParams, opts)

  log(`route regexp pathPattern=${pathPattern} re=${re} regExpParams.length=${regExpParams.length}`)

  // if no regExpParams in pathPattern, koa-mount like matching
  if (regExpParams.length === 0) {
    const prefix = pathPattern
    const trailingSlash = '/' == prefix.slice(-1)

    const match = function(path) {
      // does not match prefix at all
      if (0 != path.indexOf(prefix)) return false
      // cut prefix
      const newPath = path.replace(prefix, '') || '/'
      if (trailingSlash) return newPath
      // `/mount` does not match `/mountlkjalskjdf`
      if ('/' != newPath[0]) return false
      return newPath
    }

    return function(ctx, upstream) {
      const prev = ctx.path
      const newPath = match(prev)
      // log('mount %s %s -> %s', prefix, newPath)
      if (!newPath) return upstream()

      ctx.mountPath = prefix
      ctx.path = newPath
      log('enter %s -> %s', prev, ctx.path)
      return SyncPromise.resolve(downstream(ctx, () => {
        ctx.path = prev
        return upstream().then(() => {
          ctx.path = newPath
        })
      })).then(() => {
        log('leave %s <- %s', prev, ctx.path)
        ctx.path = prev
      })
    }
  }


  // koa-route like
  return function(ctx, next) {
    // match path
    const m = re.exec(ctx.path)
    log(`regexp ${ctx.path} ${re}`, m)
    if (m) {
      const args = m.slice(1).map(decode)
      ctx.routePath = pathPattern
      args.unshift(ctx)
      args.push(next)
      return SyncPromise.resolve(downstream.apply(ctx, args))
    }

    // miss
    return next()
  }
}

export default function(method, pathPattern, fn, opts) {
  if (typeof fn === 'function') {
    return route(pathPattern, {[method]: fn}, opts)
  }
  return route(method, pathPattern, fn, opts)
}

export function ALL(pathPattern, fn, opts) {
  console.warn('route.ALL is deprecating')
  return route(pathPattern, fn, opts)
}
export function GET(pathPattern, fn, opts) {
  return route(pathPattern, {GET: fn}, opts)
}
export function PUT(pathPattern, fn, opts) {
  return route(pathPattern, {GET: fn}, opts)
}
export function POST(pathPattern, fn, opts) {
  return route(pathPattern, {POST: fn}, opts)
}
export function WATCH(pathPattern, fn, opts) {
  return route(pathPattern, {WATCH: fn}, opts)
}
export function UNWATCH(pathPattern, fn, opts) {
  return route(pathPattern, {UNWATCH: fn}, opts)
}
