import { Injector, ProviderToken, effect, inject, isSignal } from '@angular/core'
import _, { Truthy } from 'lodash'
import { Observable, isObservable } from 'rxjs'
import { filter, first } from 'rxjs/operators'
import { Logger } from '../angular-terminal/logger'
import { onChange, subscribe } from './reactivity'

export type TODO = any

/**
 * @example
 * TODO: use Assert.ts instead
 * assert(false, "throw this error message")
 * assert(true, "nothing happens")
 * @deprecated
 */
export function assert(condition?, message?) {
  if (!condition) {
    throw new Error(message || 'assert failed')
  }
}

/**
 * Stops the execution and opens the debugger.
 */
export function assertDebug(condition?) {
  if (!condition) {
    debugger
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
 * Loop over an object [key,value] and the key or the value.
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
export function addToGlobalRg(obj) {
  globalThis['rg'] ||= {}
  globalThis['rg'] = mergeDeep(globalThis['rg'], obj)
}

export interface AnyObject {
  [prop: string]: any
}

/**
 * Waits for an observable to become "truthy"
 * @example await waitFor(observable)
 */
export function waitFor(observable: Observable<any>) {
  return observable
    .pipe(
      filter(t => !!t),
      first()
    )
    .toPromise()
}

/**
 * Listens for changes on a property and exposes it as a Signal.
 * Replaces the property with a getter/setter so it can detect changes.
 *
 * Example: listens for a property `text` and creates an Signal `$text`.
 * ```ts
 * this.text = 'blabla'
 * this.$text = new BehaviorSubject(null)
 * inputToSignal(this, 'text', '$text')
 * ```
 */
export function inputToSignal<T, K extends keyof T>(_component: T, key: K, signalKey: K) {
  const injector = inject(Injector)
  const component = _component as any

  let subscription

  // Emit following values
  onChange(component, key, input => {
    if (input) {
      if (isObservable(input)) {
        subscription?.unsubscribe()
        subscription = subscribe(component, input, value => {
          component[signalKey].set(value)
        })
      } else if (isSignal(input)) {
        effect(
          () => {
            component[signalKey].set(input())
          },
          {
            injector: injector,
            allowSignalWrites: true,
          }
        )
      } else {
        component[signalKey].set(input)
      }
    } else {
      component[signalKey].set(input)
    }
  })
}

export type InjectFunction = <T>(token: ProviderToken<T>) => T

export function async<T>(func: (...args) => T): Promise<T> {
  return new Promise(resolve =>
    setTimeout(() => {
      const res = func()
      resolve(res)
    })
  )
}

let i = 0
export function detectInfiniteLoop(nb = 1000) {
  assert(i++ < nb)
}

// export function circularReplacer() {
//   const seen = new WeakSet()
//   return (key, value) => {
//     if (typeof value === 'object' && value !== null) {
//       if (seen.has(value)) {
//         return
//       }
//       seen.add(value)
//     }
//     return value
//   }
// }

export function stringifyReplacer({ depth = 5 } = {}) {
  let objects, stack, keys
  return function (key, value) {
    //  very first iteration
    if (key === '') {
      keys = ['root']
      objects = [{ keys: 'root', value: value }]
      stack = []
      return value
    }

    //  From the JSON.stringify's doc: "The object in which the key was found is
    //  provided as the replacer's this parameter."
    //  Thus one can control the depth
    while (stack.length && this !== stack[0]) {
      stack.shift()
      keys.pop()
    }
    // console.log( keys.join('.') );

    let type = typeof value
    if (type === 'boolean' || type === 'number' || type === 'string') {
      return value
    }
    if (type === 'function') {
      return `[Function, ${value.length + 1} args]`
    }
    if (value === null) {
      return 'null'
    }
    if (!value) {
      return undefined
    }
    if (stack.length >= depth) {
      if (Array.isArray(value)) {
        return `[Array(${value.length})]`
      }
      return '[Object]'
    }
    let found = objects.find(o => o.value === value)
    if (!found) {
      keys.push(key)
      stack.unshift(value)
      objects.push({ keys: keys.join('.'), value: value })
      return value
    }
    //  actually, here's the only place where the keys keeping is useful
    return `[Duplicate: ${found.keys}]`
  }
}

export function removeFromArray(array, item) {
  return _.filter(array, i => item != i)
}

export function logError(logger: Logger, thing) {
  if (typeof thing == 'string') {
    logger.log({ message: thing, level: 'error' })
  } else if ('message' in thing || 'stack' in thing) {
    logger.log({ message: thing.message, stack: thing.stack, level: 'error' })
  } else {
    const res = _.cloneDeep(thing)
    res['level'] = 'error'
    logger.log(res)
  }
}

export function unwrapIfSignal(value: any) {
  if (isSignal(value)) {
    return value()
  } else {
    return value
  }
}

export function unwrapIfFunction(value: any) {
  if (typeof value == 'function') {
    return value()
  } else {
    return value
  }
}

// export function includesAny(array: any[], items: any[]): boolean {
//   return array.some(item => items.includes(item))
// }
