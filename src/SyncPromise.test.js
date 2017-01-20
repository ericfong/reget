import should from 'should'
import SyncPromise from './SyncPromise'

describe('SyncPromise', function() {

  it('Native Promise will not sync', async () => {
    let value = null

    Promise.resolve('A')
    .then(val => value = val)
    should(value).not.equal('A')

    new Promise(resolve => {
      resolve('B')
    })
    .then(val => value = val)
    should(value).not.equal('B')
  })

  it('SyncPromise will sync', async () => {
    let value = null

    SyncPromise.resolve('A')
    .then(val => value = val)
    should(value).equal('A')

    const p2 = SyncPromise.resolve('B')
    should(p2.isFulfilled).be.true()
    should(p2.value).equal('B')
  })

})
