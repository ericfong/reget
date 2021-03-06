
import cache from './cache'


export default function() {
  if (typeof localStorage === 'undefined') {
    return cache()
  }

  return {
    route: '/:key',
    watch({params: {key}, mountPath, reget}) {
      if (key === 'height' || key === 'width') {
        window.onresize = function() {
          const changes = {
            [`${mountPath}/height`]: window.innerHeight,
            [`${mountPath}/width`]: window.innerWidth,
          }
          reget.setCache(changes)
        }
        window.onresize()
      }
    },
    unwatch(ctx) {
      const {key} = ctx.params
      if (key === 'height' || key === 'width') {
        window.onresize = null
      }
    },
    get(ctx) {
      // just use the cached value
      ctx.status = 304
    },
    put(ctx) {
      ctx.status = 404
    },
  }
}
