import _ from 'lodash'

export default function setProxy(obj, onSet, path = []) {
  Object.assign(obj, {
    set(changes) {
      onSet(changes, path)
    },
    fork(_subPath, _subObj) {
      const subPath = Array.isArray(_subPath) ? _subPath : _subPath.split('.')
      const subObj = _subObj || _.get(obj, subPath)
      return setProxy(subObj, onSet, [...path, ...subPath])
    },
  })
  obj.set.onSet = onSet
  return obj
}



export function toMutation(changes, path) {
  // to replace ops
  let ops = _.mapValues(changes, (v, k) => {
    return k[0] === '$' ? v : {$replace: v}
  })
  // wrap by path steps
  for (let i = path.length - 1; i >= 0; i--) {
    const k = path[i]
    ops = {[k]: ops}
  }
  return ops
}

function inc(newObj, incs) {
  for (const key in incs) {
    const incVal = incs[key]
    const oldVal = newObj[key]
    if (oldVal) {
      newObj[key] += incVal
    } else {
      newObj[key] = incVal
    }
  }
}

function push(newObj, pushes) {
  for (const key in pushes) {
    const pushVal = pushes[key]
    const pushArr = Array.isArray(pushVal) ? pushVal : [pushVal]
    const oldVal = newObj[key]
    if (oldVal) {
      newObj[key] = [...oldVal, ...pushArr]
    } else {
      newObj[key] = pushArr
    }
  }
}

export function mutate(oldObj, mutation) {
  if (mutation.$replace) {
    return mutation.$replace
  }

  // copy non changed fields
  const newObj = _.isArray(oldObj) ? [...oldObj] : _.omit(oldObj, 'set', 'fork')

  // special actions
  if (mutation.$inc) {
    inc(newObj, mutation.$inc)
  }
  if (mutation.$push) {
    push(newObj, mutation.$push)
  }

  // do mutation
  _.each(mutation, (change, key) => {
    if (key[0] !== '$') {
      newObj[key] = mutate(newObj[key], change)
    }
  })
  return newObj
}
