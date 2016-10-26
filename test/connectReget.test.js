import should from 'should'
import React from 'react'
import './setup'
import {mount, render} from 'enzyme'
import sinon from 'sinon'

import {connectReget, RegetProvider, Reget, compose} from '../src'

async function asyncDbCall(data) {
  return new Promise(resolve => {
    setTimeout(() => {
      // console.log('asyncDbCall done', data)
      resolve(data)
    }, 1)
  })
}

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

  it.skip('server rendering', async () => {
    // reget handler
    const reget = new Reget({
      handler: compose(
        {
          route: 'blog/blog-1',
          async get(ctx) {
            ctx.body = await asyncDbCall({_id: 'blog-1', userId: 'user-1'})
          },
        },
        {
          route: 'user/user-1',
          async get(ctx) {
            ctx.body = await asyncDbCall({_id: 'user-1', name: 'John'})
          },
        },
      ),
    })

    // react components
    const User = connectReget(props => {
      const user = props.reget.get(`user/${props.userId}`)
      return user ? {user} : null
    })(props => {
      return <div>{props.user.name}</div>
    })
    const Blog = connectReget(props => {
      const blog = props.reget.get(`blog/${props.blogId}`)
      return blog ? {blog} : null
    })(props => <span>{props.blog._id} by <User userId={props.blog.userId} /></span>)

    sinon.spy(User.prototype, 'componentDidMount')

    // server side render
    const wrapper = render(<RegetProvider reget={reget}><span>Blog: <Blog blogId="blog-1" /></span></RegetProvider>)
    should(wrapper.html()).equal('<span>Blog: </span>')
    await reget.wait()
    should(wrapper.html()).be.exactly('<span>Blog: blog-1 by John</span>')

    // no componentDidMount called
    should(User.prototype.componentDidMount.callCount).equal(0)
    User.prototype.componentDidMount.restore()

    // transfer data to client
    const json = JSON.stringify(reget.cache.get())
    const isoData = JSON.parse(json)

    // client side
    const browserReget = new Reget({
      handler() {
        return Promise.resolve()
      },
    })
    browserReget.cache.set(isoData)
    const browserMount = mount(<RegetProvider reget={browserReget}><Blog blogId="blog-1" /></RegetProvider>)
    should(browserMount.text()).be.exactly('blog-1 by John')
  })
})
