import should from 'should'

import Reget from '../src/Reget'

describe('Reget', function() {
  it('sync', async () => {
    const reget = new Reget()

    should(reget.get('memory/me')).be.undefined()

    reget.put('memory/me', 'Data')

    should(reget.get('memory/me')).be.equal('Data')
  })

  it('async', async () => {
    const reget = new Reget()
    reget.use(async ctx => {
      return new Promise(resolve => {
        setTimeout(() => {
          ctx.body = 'fetch data from backend'
          resolve(ctx)
        }, 1)
      })
    })

    should(reget.get('user/me')).be.undefined()
  })
})
