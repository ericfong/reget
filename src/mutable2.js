import _ from 'lodash'

function toPath(_subPath) {
  return Array.isArray(_subPath) ? _subPath : _subPath.split('.')
}

const funcs = {
  $inc(obj, incs) {
    _.each(incs, (val, key) => {
      const path = key.split('.')
      const oldVal = _.get(obj, path)
      _.set(obj, path, oldVal ? oldVal + val : val)
    })
  },
  $push(obj, pushes) {
    _.each(pushes, (val, key) => {
      const path = key.split('.')
      const oldVal = _.get(obj, path)
      const newVals = Array.isArray(val) ? val : [val]
      obj[key] = oldVal ? [...oldVal, ...newVals] : newVals
    })
  },
}
const funcNames = Object.keys(funcs)

function doSet(obj, sets) {
  // special functions
  for (const funcName of funcNames) {
    if (sets[funcName]) {
      funcs[funcName](obj, sets[funcName])
    }
  }
  // loop and set
  _.each(_.omit(sets, funcNames), (val, key) => {
    _.set(obj, key, val)
  })
}

function mutate(obj, path) {
  // clone and omit mutable functions
  const newObj = _.isArray(obj) ? [...obj] : _.omit(obj, 'set', 'fork')

  if (path.length === 0) return newObj

  // do mutation
  const key = path[0]
  newObj[key] = mutate(newObj[key], path.slice(1))

  return newObj
}


export default function mutable(obj, option = {}, currPath = []) {
  const {onSet, onMutate} = option
  if (currPath.length === 0) {
    option._rootObj = obj
  }

  Object.assign(obj, {
    set(update) {
      doSet(obj, update)

      const event = {update, path: currPath}
      if (onSet) onSet(event)

      if (onMutate) {
        event.mutated = mutate(option._rootObj, currPath)
        onMutate(event)
      }
    },
    fork(_subPath, _subObj) {
      const subPath = toPath(_subPath)
      const subObj = _subObj || _.get(obj, subPath)
      return mutable(subObj, option, [...currPath, ...subPath])
    },
  })
  return obj
}
