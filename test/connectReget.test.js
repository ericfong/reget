import should from 'should'
import React from 'react'
import {mount, shallow} from 'enzyme'

import {connectReget, RegetProvider, Reget, createMiddlewares} from '../src/'

describe('connectReget', function() {
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
      return <div>{props.username}</div>
    })

    const reget = new Reget()
    const middlewares = reget.middlewares = createMiddlewares()
    middlewares.use(async ctx => {
      ctx.body = await new Promise(resolve => {
        setTimeout(() => {
          resolve('Http Result')
        }, 1)
      })
    })

    const wrapper = mount(
      <RegetProvider reget={reget}>
        <UserComp />
      </RegetProvider>
    )
    wrapper.html().should.be.exactly('<div></div>')

    await new Promise(resolve => {
      setTimeout(() => {
        resolve('Wait after re-render')
      }, 300)
    })

    wrapper.html().should.be.exactly('<div>Http Result</div>')
  })
})
