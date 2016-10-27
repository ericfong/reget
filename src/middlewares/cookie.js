import Cookie from 'js-cookie'

export default function(cookieConf) {
  return {
    route: '/:key+',
    get(ctx, key) {
      ctx.body = Cookie.get(key)
    },
    put(ctx, key) {
      const {input, expires, domain, path, secure} = ctx
      if (input === '') {
        Cookie.remove(key)
      } else {
        ctx.body = Cookie.set(key, input, {
          ...cookieConf,
          expires,
          domain,
          path,
          secure,
        })
      }
    },
  }
}
