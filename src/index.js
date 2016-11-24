export connectReget, {RegetProvider} from './connectReget'

export AutoRunner from './AutoRunner'

export Reget from './Reget'
export CacheStore from './CacheStore'
export CallContext from './CallContext'


export compose from './compose'
export mount from './mount'
export route from './route'
export toMiddleware from './toMiddleware'


export SyncPromise from './SyncPromise'


function onceWarning(func, msg) {
  let deprecateWarned = false
  return function wrap() {
    if (!deprecateWarned) {
      deprecateWarned = true
      console.warn(msg)
    }
    return func.apply(null, arguments)
  }
}

import _browserMiddleware from './middlewares/browser'
import _cacheMiddleware from './middlewares/cache'
import _localStorageMiddleware from './middlewares/localStorage'
import _cookieMiddleware from './middlewares/cookie'
import _koaCookieMiddleware from './middlewares/koaCookie'

export const browserMiddleware = onceWarning(_browserMiddleware, 'Please use import browser from \'reget/lib/middlewares/browser\'')
export const cacheMiddleware = onceWarning(_cacheMiddleware, 'Please use import cache from \'reget/lib/middlewares/cache\'')
export const localStorageMiddleware = onceWarning(_localStorageMiddleware, 'Please use import localStorage from \'reget/lib/middlewares/localStorage\'')
export const cookieMiddleware = onceWarning(_cookieMiddleware, 'Please use import cookie from \'reget/lib/middlewares/cookie\'')
export const koaCookieMiddleware = onceWarning(_koaCookieMiddleware, 'Please use import koaCookie from \'reget/lib/middlewares/koaCookie\'')
