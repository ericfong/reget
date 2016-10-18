import _ from 'lodash'
import should from 'should'

import {CacheStore} from '../src'

// function sleep(time = 2) {
//   return new Promise(resolve => setTimeout(resolve, time))
// }

describe('CacheStore', function() {
  const cacheStore = new CacheStore({maxAge: 0})

  it('get & set', async () => {
    should(cacheStore.get('foo')).equal(undefined)
    cacheStore.set('foo', 'bar')
    should(cacheStore.get('foo')).equal('bar')
  })

  it('watch & invalidate', async () => {
    let handleCount = 0
    let lastChanges = null
    function watcher(changes) {
      lastChanges = changes
      handleCount ++
    }
    function watcher2() {
    }

    // watch and hasWatch
    should(cacheStore.hasWatch('foo')).be.false()
    cacheStore.watch('foo', watcher)
    cacheStore.watch('foo', watcher)
    cacheStore.watch('bar', watcher)
    cacheStore.watch('hello', watcher2)
    should(cacheStore.hasWatch('foo')).be.true()
    should(cacheStore.hasWatch('bar')).be.true()

    // set and event
    cacheStore.set('foo', 'hi')
    cacheStore.set('foo', 'hihi')
    cacheStore.set('foo?bar', 'bye')
    await cacheStore.wait()
    should(handleCount).equal(1)
    should(Object.keys(lastChanges)).deepEqual(['foo', 'foo?bar'])

    // invalidate and event
    cacheStore.invalidate('foo')
    await cacheStore.wait()
    should(_.size(cacheStore.store)).equal(2)
    should(_.size(cacheStore.cachedTimes)).equal(1)
    should(handleCount).equal(2)
    should(Object.keys(lastChanges)).deepEqual(['foo'])

    // invalidate and cachedTimes
    cacheStore.invalidate('foo', true)
    should(_.size(cacheStore.cachedTimes)).equal(0)

    // prune before unwatch
    cacheStore.prune()
    should(cacheStore.store).properties({
      // bar is not set, so even watching still missing value
      foo: 'hihi',
    })

    // unwatch
    cacheStore.unwatch(watcher)
    should(cacheStore.hasWatch('foo')).be.false()
    should(cacheStore.hasWatch('bar')).be.false()
    should(cacheStore.hasWatch('hello')).be.true()
    cacheStore.unwatch('hello', watcher2)
    should(cacheStore.hasWatch('hello')).be.false()
  })
})
