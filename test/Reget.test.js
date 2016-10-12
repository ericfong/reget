import should from 'should'

import Reget, {cacheMiddleware} from '../src/Reget'
import createMiddlewares from '../src/createMiddlewares'
import {route} from '../src'

describe('Reget', function() {
  it('sync', async () => {
    const middlewares = createMiddlewares()
    const reget = new Reget({middlewares})
    middlewares.use(route('memory/:key', cacheMiddleware))

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
    middlewares.use(route('memory/:key', cacheMiddleware))

    // TODO await whole stack
    should(reget.get('user/me')).be.undefined()
  })

  it('route', async () => {
    const reget = new Reget()
    const middlewares = reget.middlewares = createMiddlewares()
    middlewares.use(route('memory/:key', cacheMiddleware))
    const _localStorage = {}
    middlewares.use(route('localStorage/:key', ctx => {
      const {method, url, input} = ctx
      if (method === 'GET') {
        ctx.body = _localStorage[url]
      } else {
        _localStorage[url] = input + '_localStorage'
      }
    }))

    // should(reget.get('memory/me')).be.undefined()
    // reget.put('memory/me', 'Data')
    // should(reget.get('memory/me')).be.equal('Data')

    should(reget.get('localStorage/foo')).be.undefined()
    reget.put('localStorage/foo', 'Data')
    should(reget.get('localStorage/foo')).be.equal('Data_localStorage')
  })
})
