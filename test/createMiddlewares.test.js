import should from 'should'
import createMiddlewares from '../src/createMiddlewares'

describe('createMiddlewares', function() {
  it('sync return', () => {
    const middlewares = createMiddlewares()

    middlewares.use((ctx) => {
      ctx.body = ctx.inputs.number + 1
      return ctx
    })

    const ctx = {inputs: {number: 1}}
    const result = middlewares(ctx).then(ctx => ctx.body)
    should(result.isFulfilled).be.true()
    should(result.value).equal(2)
  })

  it('async return', async () => {
    const middlewares = createMiddlewares()

    middlewares.use(async (ctx) => {
      ctx.body = await new Promise(resolve => {
        setTimeout(() => {
          resolve('Http Body')
        }, 10)
      })
    })

    const result = await middlewares().then(ctx => ctx.body)
    should(!!result.isFulfilled).be.false()
    should(result).equal('Http Body')
  })

  it('path regexp', async () => {
    const middlewares = createMiddlewares()

    middlewares.use('lesson', async (ctx, next) => {
      await next()
      ctx.body = ctx.body + ' World'
    })
    middlewares.use(ctx => {
      ctx.body = 'Hello'
    })

    should((
      await middlewares({
        url: 'lesson?courseId=7bLXN46m&branchId=bD0n20Wn',
      })
    ).body).equal('Hello World')

    should((
      await middlewares({
        url: 'lesson/bD0n20Wn',
      })
    ).body).equal('Hello')
  })
})
