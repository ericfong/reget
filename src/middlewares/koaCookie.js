import route from '../route'

export default function(koaCtx) {
  return {
    route: '/:key+',
    get(ctx, key) {
      ctx.body = koaCtx.cookies.get(key)
    },
    put({input}, key) {
      koaCtx.cookies.set(key, input)
    },
  }
}
