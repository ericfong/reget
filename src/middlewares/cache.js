
export default function() {
  return {
    route: '/:key+',
    get(ctx) {
      ctx.status = 304
    },
    put({cache, url, input}) {
      cache.set(url, input)
    },
  }
}
