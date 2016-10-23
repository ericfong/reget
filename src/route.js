import _ from 'lodash'
import pathToRegexp from 'path-to-regexp'

import SyncPromise from './SyncPromise'


function decode(val) {
  if (val) return decodeURIComponent(val)
}

function route(pathPattern, fn, opts) {
  let methods = null
  if (typeof fn === 'object') {
    methods = _.mapKeys(fn, (v, k) => k.toUpperCase())
  }

  const re = pathToRegexp(pathPattern, opts)
  return function(ctx, next) {
    let method

    // match methods
    if (methods) {
      method = methods[ctx.method]
      if (!method) return next()
    } else {
      method = fn
    }

    // match path
    const m = re.exec(ctx.path)
    if (m) {
      const args = m.slice(1).map(decode)
      ctx.routePath = pathPattern
      args.unshift(ctx)
      args.push(next)
      return SyncPromise.resolve(method.apply(ctx, args))
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
