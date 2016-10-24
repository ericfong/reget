import route from '../route'

export default function(koaCtx) {
  return function(regetCtx) {
    if (regetCtx.method === 'GET') {
      const cookie = ctx.cookies.get()
    } else if (regetCtx.method === 'PUT') {
    }
  }
}
