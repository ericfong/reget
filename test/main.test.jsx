import should from 'should'
import React from 'react'
import {mount, shallow} from 'enzyme'

import {connectReget, RegetProvider, Reget} from '../src/'


describe('main', function() {
  before(async () => {
  })
  after(async () => {
  })


  it('basic', async () => {
    const UserComp = connectReget(props => {
      return {
        username: props.reget.get('username'),
      }
    })(props => {
      return props.username
    })
    const reget = new Reget({
     fetch(url, option) {
       console.log(url, option)
     },
   })
   console.log(reget)
   const wrapper = shallow(
     <RegetProvider reget={reget}>
       <UserComp />
     </RegetProvider>
   )
   console.log(wrapper.html())
  //  wrapper.html().should.be.exactly('<div></div>')

    // should(
    // ).has.properties({
    //   created: 2,
    // })
  })
})
