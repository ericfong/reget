
const DAY = 24 * 3600 * 1000

export default function(cookieConf, koaCtx) {
  return {
    route: '/:key+',
    get(ctx) {
      const {key} = ctx.params
      ctx.body = koaCtx.cookies.get(key)
    },
    put({params: {key}, input, expires, domain, path, secure, signed, httpOnly, overwrite}) {
      const conf = {
        ...cookieConf,
        expires: new Date(Date.now() + (expires * DAY)),
        domain,
        path,
        secure,
        signed,
        httpOnly,
        overwrite,
      }
      koaCtx.cookies.set(key, input, conf)
    },
  }
}
