import should from 'should'
import _ from 'lodash'

import mutable, {mutate, toMutation} from '../src/mutable'

describe('mutable', function() {
  const invoice = {
    number: 'INV-001',
    orderItems: [
      {
        productId: 'p01',
        activityCustomers: [
          {
            activityId: 'a01',
          },
        ],
      },
    ],
    otherObj: {hello: 'world'},
  }
  const invoiceJson = JSON.stringify(invoice)


  it('mutable', async () => {
    const mergedChanges = {}
    let newInvoice = mutable(invoice, (changes, path) => {
      const mutation = toMutation(changes, path)
      newInvoice = mutate(newInvoice, mutation)
      _.merge(mergedChanges, mutation)
    })
    const orderItem = invoice.fork(['orderItems', 0])
    const activityCustomer = orderItem.fork(['activityCustomers', 0])

    // set, inc, push
    activityCustomer.set({deleted: true})
    activityCustomer.set({$inc: {total: 10}})
    orderItem.set({$push: {activityCustomers: {activityId: 'a02'}}})
    // console.log(JSON.stringify(newInvoice, null, '  '))
    should(newInvoice.orderItems[0].activityCustomers[0].deleted).true()
    should(newInvoice.orderItems[0].activityCustomers[0].total).equal(10)
    should(newInvoice.orderItems[0].activityCustomers[1].activityId).equal('a02')

    // doMutate on mergedChanges
    const anotherNewInvoice = mutate(invoice, mergedChanges)
    // console.log(JSON.stringify(mergedChanges, null, '  '))
    // console.log(JSON.stringify(anotherNewInvoice, null, '  '))
    should(newInvoice).deepEqual(anotherNewInvoice)
  })


  it('mutate', async () => {
    const newInvoice = mutate(invoice, {
      orderItems: {
        0: {
          activityCustomers: {
            $replace: [
              {activityId: 'a01'},
              {activityId: 'a02'},
            ],
          },
        },
      },
    })

    // non-touched path not mutated
    should(newInvoice.otherObj === invoice.otherObj).true()
    // all touched path mutated
    should(newInvoice !== invoice).true()
    should(newInvoice.orderItems !== invoice.orderItems).true()
    should(newInvoice.orderItems[0].activityCustomers !== invoice.orderItems[0].activityCustomers).true()

    // data is set
    should(newInvoice.orderItems[0].activityCustomers).length(2)
    should(newInvoice.orderItems[0].activityCustomers[1].activityId).equal('a02')

    // json still the same
    should(JSON.stringify(invoice)).equal(invoiceJson)
    // console.log(newInvoice.orderItems[0].activityCustomers, invoice.orderItems[0].activityCustomers)
  })
})
