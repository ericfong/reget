import should from 'should'
import React from 'react'
import './setup'
import {mount, shallow} from 'enzyme'

import {connectReget, RegetProvider, Reget, compose} from '../src'

describe('connectReget', function() {
  before(async () => {
  })
  after(async () => {
  })

  it('basic', async () => {
    const SignUp = connectReget(props => {
      return {sessonId: props.reget.get('sessonId')}
    })(props => <span>{props.sessonId}</span>)

    const UserComp = connectReget(props => {
      return {username: props.reget.get('username')}
    })(props => {
      return <div>{props.username}{!props.username && <SignUp />}</div>
    })

    const reget = new Reget({
      handler: compose(async ctx => {
        if (ctx.method === 'WATCH') {
          watchingKeys[ctx.url] = true
        } else if (ctx.method === 'UNWATCH') {
          delete watchingKeys[ctx.url]
        }
        ctx.body = await new Promise(resolve => {
          setTimeout(() => {
            resolve('Http Result')
          }, 1)
        })
      }),
    })
    const watchingKeys = {}

    const wrapper = mount(
      <RegetProvider reget={reget}>
        <UserComp />
      </RegetProvider>
    )
    wrapper.html().should.be.exactly('<div><span></span></div>')
    should(watchingKeys).deepEqual({ username: true, sessonId: true })

    await reget.wait()

    wrapper.text().should.be.exactly('Http Result')
    should(watchingKeys).deepEqual({ username: true })
  })
})
