
export default function() {
  return {
    route: '/:key+',
    get(ctx) {
      ctx.status = 304
    },
    put({reget, url, input}) {
      reget.setCache(url, input)
    },
  }
}
