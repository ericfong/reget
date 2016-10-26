import makeDebug from 'debug'

import SyncPromise from './SyncPromise'
import toMiddleware from './toMiddleware'

const log = makeDebug('reget:mount')


export default function mount(mount, handler) {
  const prefix = mount
  const mw = toMiddleware(handler)
  if (!prefix || prefix === '/') {
    return mw
  }

  // // must starting with / according to pathToRegexp, koa-mount and koa-route
  // if (pathPattern[0] !== '/') {
  //   pathPattern = `/${pathPattern}`
  // }

  const trailingSlash = '/' == prefix.slice(-1)

  const match = function(path) {
    // does not match prefix at all
    if (0 !== path.indexOf(prefix)) return false
    // cut prefix
    const newPath = path.replace(prefix, '') || '/'
    if (trailingSlash) return newPath
    // `/prefix` does not match `/mountlkjalskjdf`
    if ('/' != newPath[0]) return false
    return newPath
  }

  function mounting(ctx, upstream) {
    const prev = ctx.path
    const newPath = match(prev)
    // log('prefix %s %s -> %s', prefix, newPath)
    if (!newPath) return upstream()

    ctx.mountPath = prefix
    ctx.path = newPath
    log('enter %s -> %s', prev, ctx.path)
    return SyncPromise.resolve(mw(ctx, () => {
      ctx.path = prev
      return upstream().then(() => {
        ctx.path = newPath
      })
    })).then(() => {
      log('leave %s <- %s', prev, ctx.path)
      ctx.path = prev
    })
  }
  mounting.mount = mount
  mounting.handler = handler
  return mounting
}
