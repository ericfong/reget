
export default {
  route: '/:key+',
  get(ctx, key) {
    const val = localStorage.getItem(key)
    try {
      ctx.body = JSON.parse(val)
    } catch (err) {
      ctx.body = val
    }
  },
  put({cache, input}, key) {
    if (!input) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, typeof input === 'string' ? input : JSON.stringify(input))
    }
  },
}
