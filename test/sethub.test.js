import should from 'should'

import sethub, {mutate} from '../src/sethub'

describe('mutable', function() {
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

  it('fork, set, inc, push', async () => {
    const rootObj = JSON.parse(dataJson)
    let mutated = sethub(rootObj, (e) => {
      // console.log('onSet', e)
      mutated = mutate(e.root, e.path)
      // console.log('>>', JSON.stringify(mutated, null, '  '))
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
