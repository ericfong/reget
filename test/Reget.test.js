import should from 'should'

import Reget, {cacheMiddleware} from '../src/Reget'
import createMiddlewares from '../src/createMiddlewares'

describe('Reget', function() {
  it('sync', async () => {
    const middlewares = createMiddlewares()
    const reget = new Reget({middlewares})
    middlewares.use('memory/:key', cacheMiddleware.bind(reget))

    should(reget.get('memory/me')).be.undefined()

    reget.put('memory/me', 'Data')

    should(reget.get('memory/me')).be.equal('Data')
  })

  it('async', async () => {
    const reget = new Reget()
    const middlewares = reget.middlewares = createMiddlewares()
    middlewares.use(async ctx => {
      return new Promise(resolve => {
        setTimeout(() => {
          ctx.body = 'fetch data from backend'
          resolve(ctx)
        }, 1)
      })
    })
    middlewares.use('memory/:key', cacheMiddleware.bind(reget))

    // TODO await whole stack
    should(reget.get('user/me')).be.undefined()
  })

  it('route', async () => {
    const reget = new Reget()
    const middlewares = reget.middlewares = createMiddlewares()
    middlewares.use('memory/:key', cacheMiddleware.bind(reget))
    const _localStorage = {}
    middlewares.use('localStorage/:key', ctx => {
      const {method, url, body} = ctx
      if (method === 'GET') {
        ctx.body = _localStorage[url]
      } else {
        _localStorage[url] = body + '_localStorage'
      }
    })

    // should(reget.get('memory/me')).be.undefined()
    // reget.put('memory/me', 'Data')
    // should(reget.get('memory/me')).be.equal('Data')

    should(reget.get('localStorage/foo')).be.undefined()
    reget.put('localStorage/foo', 'Data')
    should(reget.get('localStorage/foo')).be.equal('Data_localStorage')
  })
})
