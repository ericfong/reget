
export default function cacheMiddleware(ctx) {
  const {method, url, input, cache} = ctx
  if (method === 'GET') {
    ctx.status = 304
  } else if (method === 'PUT' || method === 'POST') {
    cache.set(url, input)
  }
}
