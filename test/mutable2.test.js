import should from 'should'

import mutable from '../src/mutable2'

describe('mutable2', function() {
  const dataJson = JSON.stringify({
    str: 'INV-001',
    arr: [
      {
        _id: 'p01',
        deepArr: [
          {
            _id: 'a01',
          },
        ],
      },
    ],
    otherObj: {hello: 'world'},
  })

  it('3 level', async () => {
    const rootObj = JSON.parse(dataJson)
    let mutated
    mutable(rootObj, {
      // onSet(e) {
      //   console.log('onSet', e)
      // },
      onMutate(e) {
        mutated = e.mutated
      },
    })

    // set, inc, push
    rootObj.fork(['arr', 0]).fork(['deepArr', 0]).set({readAt: true})
    rootObj.fork(['arr', 0]).fork(['deepArr', 0]).set({$inc: {total: 10}})
    should(rootObj.arr[0].deepArr[0].readAt).true()
    should(rootObj.arr[0].deepArr[0].total).equal(10)

    // array replace
    rootObj.set({
      'arr.0.deepArr': [{userId: 'a01-a'}, {userId: 'a01-b'}],
    })
    should(rootObj.arr[0].deepArr[1].userId).equal('a01-b')
    // array push
    rootObj.fork(['arr', 0]).set({$push: {deepArr: {userId: 'a02'}}})
    should(rootObj.arr[0].deepArr[2].userId).equal('a02')


    // non-touched path not mutated
    should(rootObj.otherObj === mutated.otherObj).true()
    // all touched path mutated
    should(rootObj !== mutated).true()
    should(rootObj.arr !== mutated.arr).true()

    // json still the same
    should(JSON.stringify(rootObj)).equal(JSON.stringify(mutated))
  })
})
