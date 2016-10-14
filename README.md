# reget

React reactive cache for any async calls, http fetching, or memory store accesses.

[![state](https://img.shields.io/badge/state-stable_and_welcome_review-green.svg)]()

[![npm](https://img.shields.io/npm/dt/reget.svg?maxAge=2592000?style=flat-square)]()
[![npm](https://img.shields.io/npm/v/reget.svg)]()
[![npm](https://img.shields.io/npm/l/reget.svg)]()

[![NPM](https://nodei.co/npm-dl/reget.png?months=1)](https://nodei.co/npm/reget/)


__How It works?__

reget is simple key-value cache. During data getting, reget will call a list of middlewares if cache is missing or too old. Result from middlewares will put into the cache and notify all listeners.

You can implement koa-like middlewares to asynchronously fetch HTTP RESTful resources, worker communication or synchronously access localStorage.

Welcome to extend or hack Reget or other classes to change behaviours


## Http get, put, post for react component
```js
import connectReget from 'reget'

function PureComponent({user}) {
  return user.name
}

export default connectReget(({userId, reget}) => {
  // assume you have setup middleware to fetch HTTP
  const user = reget.get(`user/${userId}`)
  // first get will be undefined
  // after HTTP response and cached, connectReget will be re-run
  // so, second get will get user
  return {user: user}

  // you can return null to stop child component rendering
})(PureComponent)
```


## Setup
```js
import {Reget, RegetProvider, createMiddlewares, route} from 'reget'

// create koa-like middlewares
const middlewares = createMiddlewares(async ctx => {
  // fetch http based on ctx.url, body and headers
  ctx.body = await window.fetch(ctx.url, {
    body: ctx.input,
    headers: ctx.headers,
  })
})

// create reget cache and assign it with middlewares
const reget = new Reget({middlewares})

// Assign to your React context
<RegetProvider reget={reget}>
  <MyApp />
</RegetProvider>
```



### Use Reget alone
Reget can be a
```js
import {Reget, createMiddlewares, route, cacheMiddleware} from 'reget'

const reget = new Reget()
reget.middlewares = createMiddlewares(
  route('memory/:key*', cacheMiddleware)
)

reget.put('memory/foo', 'bar')

reget.get('memory/foo') === 'bar'
```

#### API
reget will create a CallContext instance and pass down to middlewares

__CallContext__
- request related
 - method (default 'GET')
 - url (url with query string, default '/')
 - path (url without query string, default '/')
 - ifModifiedSince (default null)
 - headers (default undefined)
 - input (request body or data, default null)

- response related
 - status (http-like response status getter and setter, default 404)
 - body (http-like response body getter and setter, default null)
 - get function: get normalized header
 - set function: set header



### Middlewares
koa like middlewares system
```js
import {createMiddlewares, route} from 'reget'

const runMiddlewares = createMiddlewares()

runMiddlewares.use(route('foo', async (ctx, next) => {
  await next()
  ctx.body = ctx.body + ' World'
}))
runMiddlewares.use(ctx => {
  ctx.body = 'Hello'
})

const ctx = {
  url: 'foo',
}
const returnCtx = await runMiddlewares(ctx)
// returnCtx.body === 'Hello World'
```

#### API

__middlewares.use(middlewares)__
middlewares can be array or single functions, to be run according to the append order

__createMiddlewares(middlewares)__
create a runMiddlewares function that accept a context argument and pass down to all middlewares

__route(pathToRegExp, middleware, optionsForRegExp)__
like koa-route, route middleware based on ctx.url. Path pattern use [path-to-regexp](https://www.npmjs.com/package/path-to-regexp)


### SyncPromise
SyncPromise can wrap a value into a Promise like object. Why? because normal Promise .then is not sync

```js
let value = null

Promise.resolve('A')
.then(val => value = val)
// value !== 'A'

// But

SyncPromise.resolve('A')
.then(val => value = val)
// value === 'A'
```
