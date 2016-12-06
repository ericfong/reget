import _ from 'lodash'

function toPath(_subPath) {
  return Array.isArray(_subPath) ? _subPath : _subPath.split('.')
}

const funcs = {
  $inc(target, incs) {
    _.each(incs, (val, key) => {
      const path = key.split('.')
      const oldVal = _.get(target, path)
      _.set(target, path, oldVal ? oldVal + val : val)
    })
  },
  $push(target, pushes) {
    _.each(pushes, (val, key) => {
      const path = key.split('.')
      const oldVal = _.get(target, path)
      const newVals = Array.isArray(val) ? val : [val]
      target[key] = oldVal ? [...oldVal, ...newVals] : newVals
    })
  },
}
const funcNames = Object.keys(funcs)

function doSet(target, sets) {
  // special functions
  for (const funcName of funcNames) {
    if (sets[funcName]) {
      funcs[funcName](target, sets[funcName])
    }
  }
  // loop and set
  _.each(_.omit(sets, funcNames), (val, key) => {
    _.set(target, key, val)
  })
}


// event.mutated = mutate(option.root, currPath)
export function mutate(target, path) {
  // clone and omit fork&set functions
  const newObj = _.isArray(target) ? [...target] : _.omit(target, 'set', 'fork')

  if (path.length === 0) return newObj

  // do mutation recursively
  const key = path[0]
  newObj[key] = mutate(newObj[key], path.slice(1))

  return newObj
}


export default function sethub(target, onSet, option = {}, currPath = []) {
  if (currPath.length === 0) {
    option.root = target
  }

  Object.assign(target, {
    fork(_subPath, _subObj) {
      const subPath = toPath(_subPath)
      const subObj = _subObj || _.get(target, subPath)
      // warning when subObj = null
      return sethub(subObj, onSet, option, [...currPath, ...subPath])
    },
    set(update) {
      doSet(target, update)
      if (onSet) {
        onSet({
          target,
          update,
          path: currPath,
          root: option.root,
        })
      }
    },
  })
  return target
}
