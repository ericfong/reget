__Reget__ ![https://img.shields.io/npm/v/reget.svg](https://img.shields.io/npm/v/reget.svg?style=flat-square) [![state](https://img.shields.io/badge/state-rc-green.svg?style=flat-square)]() [![npm](https://img.shields.io/npm/dt/reget.svg?maxAge=2592000&style=flat-square)]() [![npm](https://img.shields.io/npm/l/reget.svg?style=flat-square)]()

# Deprecated and please migrate to __[datavan](http://npmjs.com/package/datavan)__, which provide more features

> HTTP API Accessor for React with auto-reactive-cache and middlewares.
> Restful React reactive cache for any async calls, http fetching, or memory store accesses.

__Features__
- auto-reactive-cache
  - API results are cached and auto prune
  - AutoRunner(function) auto watch and re-run when related caches changed
  - reget.get() is synchronized function, which get cache and trigger http fetch as a side effect

- middlewares
  - koa middleware like
  - can use middlewares to convert data, as ORM or distribute to diff cache keys
  - also work for synchronized access or localStorage or memory


__How It works?__

reget is simple key-value cache. During data getting, reget will call a list of middlewares if cache is missing or too old. Result from middlewares will put into the cache and notify all listeners.

You can implement koa-like middlewares to asynchronously fetch HTTP RESTful resources, worker communication or synchronously access localStorage.

Welcome to extend or hack Reget or other classes to change behaviours


__Table of Contents__
<!-- TOC START min:1 max:3 link:true update:true -->
  - [Http get, put, post for react component](#http-get-put-post-for-react-component)
  - [Setup](#setup)
  - [Comparison](#comparison)
  - [Server Rendering](#server-rendering)
  - [Use Reget alone](#use-reget-alone)
    - [API](#api)
  - [CacheStore class methods](#cachestore-class-methods)
  - [Reget class](#reget-class)
  - [Middlewares](#middlewares)
    - [Middleware API](#middleware-api)
    - [Middleware Example](#middleware-example)
  - [SyncPromise](#syncpromise)

<!-- TOC END -->




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
```js
reget.serverRender(reget => {
  return ReactDOMServer.renderToString(<RegetProvider reget={reget}><App /></RegetProvider>)
})
.then(outputHtml => {
  console.log(outputHtml)
})

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
import {Reget, compose, mount} from 'reget'

import browserMiddleware from 'reget/lib/middlewares/browser'
import cacheMiddleware from 'reget/lib/middlewares/cache'
import localStorageMiddleware from 'reget/lib/middlewares/localStorage'
import cookieMiddleware from 'reget/lib/middlewares/cookie'
import koaCookieMiddleware from 'reget/lib/middlewares/koaCookie'


const reget = new Reget({
  handler: compose(
    mount('memory', cacheMiddleware()),
    // or
    {mount: 'memory', handler: cacheMiddleware()},

    {
      route: 'abc/:key',
      async get(ctx, next) {
        // ...
      },
      async put(ctx, next) {
        // ...
      },
      async post(ctx, next) {
        // ...
      },
    }
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
```js
get(key)  // sync get cache
set(key, value)  // sync set cache, trigger watchers to re-run in next tick.
invalidate(key, allSuffix)  // invalidate cache
watch(key, func)  // register a watcher for change on key
unwatch(key, func)  // unregister a watcher for change on key
hasWatch(key)
getPendingPromise()  // get pending change promise (or null), so you can wait for
prune()  // gc this cache store
```


## Reget class
```js
cache  // this instance's CacheStore
handler()  // assigned handler function for request (GET, PUT, POST), can be created by ```compose``` module
get(pathname, query, option)  // http get (Sync)
put(url, input, option)  // http put (Async/Promise)
post(url, input, option)  // http post (Async/Promise)
reload(url, option)  // http get (Async/Promise)
request(option)  // http request (Async/Promise)
serverRender()
getLoadingPromise(key) // get promise for all loading calls or one cache, null when promise not found
wait()  // wait for all pending requests and events
getCache() // If !key, entire store will be returned
setCache() // If key is object, key&value will be import to this cache store.
invalidate(key, allSuffix)
watch(key, func)
unwatch(key, func)
```


## Middlewares
koa like middlewares system. Please refer to [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) for path pattern.
```js
import {compose} from 'reget'

const handler = compose(
  {
    route: 'foo/:key',
    async get(ctx, next) {
      // ctx.params = {key: 'hi'}
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

const ctx = {path: 'foo/hi'}
await handler(ctx)
// ctx.body === 'Hello World'
```

### Middleware API

__compose(...middlewares)__
create a function that accept a context argument and pass down to all middlewares

middlewares can be one of
- function(ctx, next){}
- array of function(ctx, next){}
- object: {route: 'pathPattern', get(){}, put(){}, post(){}, watch(){}, unwatch(){}}
- object: {mount: 'prefix', handler: anotherMiddleware}
- mount('prefix', anotherMiddleware)

like koa-route, path pattern use [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) to build regexp


### Middleware Example
```js
browserMiddleware = {
  route: '/:key',
  watch({params: {key}, mountPath, reget}) {
    if (key === 'height' || key === 'width') {
      window.onresize = function() {
        const changes = {
          // mountPath = 'browser' if you use mount('browser', browserMiddleware)
          [`${mountPath}/height`]: window.innerHeight,
          [`${mountPath}/width`]: window.innerWidth,
        }
        reget.setCache(changes)
      }
      window.onresize()
    }
  },
  unwatch(ctx) {
    const {key} = ctx.params
    if (key === 'height' || key === 'width') {
      window.onresize = null
    }
  },
  get(ctx) {
    // just use the cached value
    ctx.status = 304
  },
  put(ctx) {
    // cannot put
    ctx.status = 404
  },
}
```


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
