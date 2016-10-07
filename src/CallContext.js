import _ from 'lodash'

export default class CallContext {
  // req
  method = 'GET'
  url = '/'
  path = '/'
  ifModifiedSince = null
  // headers = {}
  inputs = null

  // res
  statusCode = 404
  _body = null

  constructor(ctxData) {
    if (ctxData) {
      Object.assign(this, ctxData)
      this.headers = {}
      _.each(ctxData.headers, (val, field) => {
        this.headers[field.toLowerCase()] = val
      })
    }
  }

  get body() {
    return this._body
  }
  set body(val) {
    this._body = val
    // set the status
    if (!this._explicitStatus) {
      this.statusCode = null == val ? 204 : 200
    }
  }

  get status() {
    return this.statusCode
  }
  set status(code) {
    this._explicitStatus = true
    this.statusCode = code
  }

  get(field){
    return this.headers[field.toLowerCase()] || ''
  }

  set(field, val){
    if (2 == arguments.length) {
      if (Array.isArray(val)) val = val.map(String)
      else val = String(val)
      this.headers(field.toLowerCase(), val)
    } else {
      for (var key in field) {
        this.set(key, field[key])
      }
    }
  }
}
