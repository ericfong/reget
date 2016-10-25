import should from 'should'

import {CallContext, compose} from '../src'

function runMiddleware(middleware, data) {
  const ctx = new CallContext(data)
  return middleware(ctx)
  .then(() => ctx)
}

describe('compose middlewares', function() {
  it('route methods', async () => {
    const middleware = compose(
      {
        route: 'user/:id',
        GET(ctx, id) {
          ctx.body = `get ${id}`
        },
        PUT(ctx, id) {
          ctx.body = `put ${id}`
        },
      }
    )

    should(
      await runMiddleware(middleware, {
        url: 'user/123',
      })
    ).property('body', 'get 123')
    should(
      await runMiddleware(middleware, {
        method: 'put',
        url: 'user/123',
      })
    ).property('body', 'put 123')
  })

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
    const mw = compose(async (ctx) => {
      ctx.body = await new Promise(resolve => {
        setTimeout(() => {
          resolve('Http Body')
        }, 10)
      })
    })

    const result = runMiddleware(mw)
    should(!!result.isFulfilled).be.false()
    should(await result).property('body', 'Http Body')
  })

  it('path regexp', async () => {
    const mw = compose([
      {
        route: 'lesson',
        async get(ctx, next) {
          await next()
          ctx.body = ctx.body + ' World'
        },
      },
      ctx => {
        ctx.body = 'Hello'
      },
    ])

    should(
      await runMiddleware(mw, {
        url: 'lesson?courseId=7bLXN46m&branchId=bD0n20Wn',
      })
    ).property('body', 'Hello World')
    should(
      await runMiddleware(mw, {
        url: 'lesson/bD0n20Wn',
      })
    ).property('body', 'Hello')
  })

  it('set middlewares during create', async () => {
    const mw = compose(ctx => {
      ctx.body = ctx.input + 1
    })
    should(
      await runMiddleware(mw, {
        input: 1,
      })
    ).property('body', 2)

    const mw2 = compose([
      async (ctx, next) => {
        await next()
        ctx.body += 1
      },
      ctx => ctx.body = ctx.input + 1,
    ])
    should(
      await runMiddleware(mw2, {
        input: 1,
      })
    ).property('body', 3)

    const mw3 = compose([
      async (ctx, next) => {
        await next()
        ctx.body += 1
      },
      ctx => ctx.body = ctx.input + 1,
    ])
    should(
      await runMiddleware(mw3, {
        input: 1,
      })
    ).property('body', 3)
  })
})
