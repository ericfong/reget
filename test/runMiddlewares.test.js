import runMiddlewares from '../src/runMiddlewares'

describe('runMiddlewares', function() {
  it('sync return', async () => {
    const middlewares = [
      (ctx) => {
        ctx.number ++
        ctx.status = 200
        return ctx
      },
    ]

    const ctx = {number: 1}
    const result = await runMiddlewares(ctx, middlewares)
    result.should.has.properties({
      number: 2,
      status: 200,
    })
  })
})
