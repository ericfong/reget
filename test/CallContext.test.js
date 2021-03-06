import should from 'should'
import CallContext from '../src/CallContext'

describe('CallContext', function() {

  it('CallContext status', async () => {
    let ctx
    ctx = new CallContext()
    ctx.status.should.equal(404)

    ctx = new CallContext()
    ctx.body = null
    ctx.status.should.equal(204)

    ctx = new CallContext()
    ctx.body = {obj: 1}
    ctx.status.should.equal(200)

    ctx = new CallContext({
      url: 'lesson?courseId=7bLXN46m&branchId=bD0n20Wn',
    })
    ctx.path.should.equal('lesson')
  })
})
