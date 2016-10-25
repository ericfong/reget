
import compose from './compose'
import mount from './mount'
import route from './route'


export default function toMiddleware(fn) {
  if (!fn) throw new Error(`Cannot cast ${fn} to middleware`)
  const type = typeof fn
  if (type === 'function') return fn

  if (type === 'object') {
    if (Array.isArray(fn)) {
      return compose(fn)
    } else if (fn.mount) {
      return mount(fn)
    } else if (fn.route) {
      return route(fn)
    }
  }

  return fn
}
