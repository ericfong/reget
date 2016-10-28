import should from 'should'

import {compose, Reget, AutoRunner, cacheMiddleware} from '../src'

function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

describe('Reget', function() {
  it('sync', async () => {
    const reget = new Reget({
      handler: compose({
        mount: 'memory',
        handler: cacheMiddleware(),
      }),
    })

    should(reget.get('memory/me')).be.undefined()

    reget.put('memory/me', 'Data')

    should(reget.get('memory/me')).be.equal('Data')
  })

  it('async', async () => {
    const reget = new Reget({
      handler: compose(
        async ctx => {
          return new Promise(resolve => {
            setTimeout(() => {
              ctx.body = 'fetch data from backend'
              resolve()
            }, 1)
          })
        },
        {mount: 'memory', handler: cacheMiddleware()}
      ),
    })

    should(reget.get('user/me')).be.undefined()
    // for display isLoading animation
    should(!!reget.getLoadingPromise()).true()
    await reget.getLoadingPromise()
    should(reget.get('user/me')).equal('fetch data from backend')
  })

  it('route', async () => {
    const _localStorage = {}
    const reget = new Reget({
      handler: compose([
        {mount: 'memory', handler: cacheMiddleware()},
        {
          route: 'localStorage/:key',
          get(ctx, key) {
            ctx.body = _localStorage[key]
          },
          put({input}, key) {
            _localStorage[key] = input + '_localStorage'
          },
        },
      ]),
    })

    should(reget.get('memory/me')).be.undefined()
    reget.put('memory/me', 'Data')
    should(reget.get('memory/me')).be.equal('Data')

    should(reget.get('localStorage/foo')).be.undefined()
    reget.put('localStorage/foo', 'Data')
    should(_localStorage).property('foo', 'Data_localStorage')
    should(reget.get('localStorage/foo')).be.equal('Data_localStorage')
  })

  it('number of call when cached and AutoRunner time', async () => {
    let numOfCall = 0
    const reget = new Reget({
      handler: compose(ctx => {
        if (ctx.method === 'GET') numOfCall++
        ctx.body = 'X'
      }),
    })

    reget.get('numberOfCalls')
    should(numOfCall).equal(1)
    reget.get('numberOfCalls')
    should(numOfCall).equal(1)

    await sleep(10)

    new AutoRunner(reget, wrappedReget => {
      wrappedReget.get('numberOfCalls')
      should(numOfCall).equal(2)
    })
  })
})
