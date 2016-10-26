import Cookie from 'js-cookie'

export default function() {
  return {
    route: '/:key+',
    get(ctx, key) {
      ctx.body = Cookie.get(key)
    },
    put(ctx, key) {
      if (ctx.input === '') {
        Cookie.remove(key)
      } else {
        Cookie.set(key, ctx.input, ctx)
      }
    },
  }
}
