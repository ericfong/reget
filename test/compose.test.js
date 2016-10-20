import should from 'should'

import {CallContext, compose} from '../src'
import {GET} from '../src/route'

describe('compose middlewares', function() {
  it('sync return', () => {
    const middlewares = compose((ctx) => {
      ctx.body = ctx.inputs.number + 1
      return ctx
    })

    const ctx = {inputs: {number: 1}}
    const result = middlewares(new CallContext(ctx)).then(ctx => ctx.body)
    should(result.isFulfilled).be.true()
    should(result.value).equal(2)
  })

  it('async return', async () => {
    const middlewares = compose(async (ctx) => {
      ctx.body = await new Promise(resolve => {
        setTimeout(() => {
          resolve('Http Body')
        }, 10)
      })
    })

    const result = await middlewares(new CallContext()).then(ctx => ctx.body)
    should(!!result.isFulfilled).be.false()
    should(result).equal('Http Body')
  })

  it('path regexp', async () => {
    const middlewares = compose([
      GET('lesson', async (ctx, next) => {
        await next()
        ctx.body = ctx.body + ' World'
      }),
      ctx => {
        ctx.body = 'Hello'
      },
    ])

    should((
      await middlewares(new CallContext({
        url: 'lesson?courseId=7bLXN46m&branchId=bD0n20Wn',
      }))
    ).body).equal('Hello World')

    should((
      await middlewares(new CallContext({
        url: 'lesson/bD0n20Wn',
      }))
    ).body).equal('Hello')
  })

  it('set middlewares during create', async () => {
    const middlewares = compose(ctx => {
      ctx.body = ctx.input + 1
    })
    should((
      await middlewares(new CallContext({
        input: 1,
      }))
    ).body).equal(2)

    const middlewares2 = compose([
      async (ctx, next) => {
        await next()
        ctx.body += 1
      },
      ctx => ctx.body = ctx.input + 1,
    ])
    should((
      await middlewares2({
        input: 1,
      })
    ).body).equal(3)

    const middlewares3 = compose([
      async (ctx, next) => {
        await next()
        ctx.body += 1
      },
      ctx => ctx.body = ctx.input + 1,
    ])
    should((
      await middlewares3({
        input: 1,
      })
    ).body).equal(3)
  })
})
