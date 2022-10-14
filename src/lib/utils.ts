import * as _ from 'lodash'
import { filter } from 'rxjs/operators'

/**
 * @example
 * assert(false, "throw this error message")
 * assert(true, "nothing happens")
 */
export function assert(condition?, message?) {
  if (!condition) {
    throw new Error(message || 'assert failed')
  }
}

export const filterNulls = filter((i: any) => i != null)

export function longest(array) {
  return array.reduce((previous, current) => {
    return current.key.length > previous ? current.key.length : previous
  }, 0)
}

export function moveToLast(array, item) {
  _.remove(array, i => i == item)
  array.push(item)
  return array
}

export function removeLastMatch(array, item) {
  if (array == undefined) throw new Error('no array')

  for (let i = array.length - 1; i >= 0; i--) {
    const current = array[i]
    if (current == item) {
      return array.splice(i, 1)
    }
  }
  return array
}

export function remove(array, item) {
  _.remove(array, i => i == item)
  return array
}

export function last(array) {
  if (array.length <= 0) {
    return undefined
  }
  return array[array.length - 1]
}

/**
 * Loop over an object [key,value] and change anything.
 * Creates a new object.
 * If `undefined` is returned, the key is removed from the object.
 */
export function mapKeyValue(object, func: (key, value) => [key: string, value: any] | undefined) {
  let newObject = {}
  for (const [key, value] of Object.entries(object)) {
    const res = func(key, value)
    if (res) {
      const [customName, customValue] = res
      newObject[customName] = customValue
    }
  }
  return newObject
}

export function mergeDeep(object, other) {
  function customizer(objValue, srcValue) {
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue)
    }
  }

  return _.mergeWith(object, other, customizer)
}

/**
 * Add something to the global variable `rg` from `rectangulr`.
 * @example addToGlobal({
 *  myGlobalFunction: (text)=>{console.log(text)}
 * })
 * rg.myGlobalFunction("print this")
 */
export function addToGlobal(obj) {
  globalThis['rg'] ||= {}
  globalThis['rg'] = mergeDeep(globalThis['rg'], obj)
}
