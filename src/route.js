import pathToRegexp from 'path-to-regexp'

import SyncPromise from './SyncPromise'


function decode(val) {
  if (val) return decodeURIComponent(val)
}

function matchMethod(ctx, method) {
  if (!method) return true
  if (ctx.method === method) return true
  if (method === 'GET' && ctx.method === 'HEAD') return true
  return false
}


function route(method, pathPattern, fn, opts) {
  if (method) method = method.toUpperCase()
  const re = pathToRegexp(pathPattern, opts)
  return function(ctx, next) {
    // method
    if (!matchMethod(ctx, method)) return next()

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

export default function(method, pathPattern, fn, opts) {
  if (typeof fn === 'function') {
    return route(method, pathPattern, fn, opts)
  } else if (typeof pathPattern === 'function') {
    return route(null, method, pathPattern, fn)
  }
  throw new Error('Unknown pattern of arguments')
}

export function ALL(pathPattern, fn, opts) {
  return route(null, pathPattern, fn, opts)
}
export function GET(pathPattern, fn, opts) {
  return route('GET', pathPattern, fn, opts)
}
export function PUT(pathPattern, fn, opts) {
  return route('PUT', pathPattern, fn, opts)
}
export function POST(pathPattern, fn, opts) {
  return route('POST', pathPattern, fn, opts)
}
export function WATCH(pathPattern, fn, opts) {
  return route('WATCH', pathPattern, fn, opts)
}
export function UNWATCH(pathPattern, fn, opts) {
  return route('UNWATCH', pathPattern, fn, opts)
}
