# reget

React reactive cache for any async calls, http fetching, or memory store accesses.

[![state](https://img.shields.io/badge/state-rc-green.svg)]()

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
import {connectReget} from 'reget'

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
import {Reget, RegetProvider, compose} from 'reget'

// create reget cache and assign it with middlewares
const reget = new Reget({
  // create koa-like middlewares
  handler: compose(async ctx => {
    // fetch http based on ctx.url, body and headers
    ctx.body = await window.fetch(ctx.url, {
      body: ctx.input,
      headers: ctx.headers,
    })
  }),  
})

// Assign to your React context
<RegetProvider reget={reget}>
  <MyApp />
</RegetProvider>
```


## Comparison

Compare to Flux/Redux
- Built-in support for async, http, promise call
- Designed for big state tree. Cached state will be garbage collected
- No need to define constants (you can define url generate functions)

Compare to Relay/Falcor
- Can call any http endpoint (Restful or php page or even image)
- Flexible code your middleware, data conversion and normalization in js side


## Server Rendering
__Server Rendering will be comming soon__
```js
// server side first render
ReactDOMServer.renderToString(<RegetProvider reget={reget}><App /></RegetProvider>)
await reget.wait()
// server side second render
var outputHtml = ReactDOMServer.renderToString(<RegetProvider reget={reget}><App /></RegetProvider>)

// transfer data to client
const json = JSON.stringify(reget.getCache())
// -------
const isoData = JSON.parse(json)

// client side
const browserReget = new Reget({
  // handler()
})
browserReget.setCache(isoData)
ReactDOM.render(<RegetProvider reget={browserReget}><App /></RegetProvider>, dom)

```
You can use [iso](https://www.npmjs.com/package/iso) to ship data to browser



## Use Reget alone
Reget can be a
```js
import {Reget, compose, mount, cacheMiddleware} from 'reget'

const reget = new Reget({
  handler: compose(
    mount('memory', cacheMiddleware)
  ),
})

reget.put('memory/foo', 'bar')
reget.get('memory/foo') === 'bar'
```

### API
reget will create a CallContext instance and pass down to middlewares

__CallContext fields, getters and setters__
```js
// ctx fields
reget: [Object] // caller reget object. Middleware is valid to call middlewares stack again, (prevent recursive problem on your own).
cache: [Object] // reget's cache. middleware can use this to safely put data into cache

// request related fields
method: 'GET' // default 'GET'
url: '/' // url with query string, default '/'
path: '/' // url without query string, default '/'
ifModifiedSince: null // default null
headers: null // default undefined
input: null // request body or data, default null

// response related fields
status: 404 // http-like response status getter and setter, default 404)
body: null  // http-like response body getter and setter, default null)
get: function() {} // get normalized header
set: function() {} // set header
```


## CacheStore class methods
- get(key)  // sync get cache. If !key, entire store will be returned
- set(key, value)  // sync set cache, trigger watchers to re-run in next tick. If key is object, key&value will be import to this cache store.
- invalidate(key, allSuffix)  // invalidate cache
- watch(key, func)  // register a watcher for change on key
- unwatch(key, func)  // unregister a watcher for change on key
- hasWatch(key)
- hasPendingEvent()  // has pending change not yet run
- wait()  // wait for pending event done
- prune()  // gc this cache store



## Reget class
- cache  // this instance's CacheStore
- handler  // handler function for request (GET, PUT, POST), can be created by ```compose``` module
- get(pathname, query, option)  // http get (Sync)
- put(url, input, option)  // http put (Async/Promise)
- post(url, input, option)  // http post (Async/Promise)
- reload(url, option)  // http get (Async/Promise)
- request(option)  // http request (Async/Promise)
- wait()  // wait for all pending requests and events
- getCache()
- setCache()
- invalidate(key, allSuffix)
- watch(key, func)
- unwatch(key, func)



## Middlewares
koa like middlewares system. Please refer to [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) for path pattern.
```js
import {compose} from 'reget'

const handler = compose(
  {
    route: 'foo',
    async get(ctx, next) {
      await next()
      ctx.body = ctx.body + ' World'
    },
    async put(ctx, next) {
      DB.save(ctx.input)
      ctx.status = 200
    },
  },
  ctx => {
    ctx.body = 'Hello'
  },
)

const ctx = {path: 'foo'}
await handler(ctx)
// ctx.body === 'Hello World'
```

### API

__compose(...middlewares)__
create a function that accept a context argument and pass down to all middlewares

middlewares can be one of
- function(ctx, next){}
- array of function(ctx, next){}
- object: {route: 'pathPattern', get(){}, put(){}, post(){}, watch(){}, unwatch(){}}
- object: {mount: 'prefix', handler: anotherMiddleware}
- mount('prefix', anotherMiddleware)

like koa-route, path pattern use [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) to build regexp



## SyncPromise
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
