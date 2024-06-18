import { computed, isSignal, signal, WritableSignal } from '@angular/core'
import { BehaviorSubject, isObservable, Observable, Subscription } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { Destroyable } from './mixins'
import { addToGlobalRg } from './utils'

/**
 * A piece of reactive state. The changes can be subscribed to, and built upon.
 * Similar to a BehaviorSubject but:
 * 	- the source of new values can be changed while retaining the local value and downstream subscriptions
 * 	- it's easy to unsubscribe upstream/downstream when the component is destroyed
 * @deprecated
 */
export class State<T> {
  $: BehaviorSubject<T>

  source: Observable<T>
  subscription: Subscription
  private _value: T

  _until: Observable<T>

  constructor(defaultValue: T, until = null, source = null) {
    this.$ = new BehaviorSubject(defaultValue)

    this.value = defaultValue

    this.subscribeSource(source)
    this.until(until)
  }

  get value(): T {
    return this._value
  }

  set value(value: T) {
    this._value = value
    this.changed()
  }

  changed() {
    this.$.next(this.value)
  }

  /**
   * Sets the source of new values
   * @param source An observable providing the new values or a plain value
   */
  subscribeSource(source) {
    this.source = source

    this._unsubscribeSource()

    // Subscribe to the new source if observable
    if (isObservable(this.source)) {
      this.subscription = this.source.subscribe(value => {
        this.value = value
      })
    } else {
      this.value = this.source
    }
  }

  /**
   *
   * @param until An observable.
   */
  until(until: Observable<T>) {
    this._until = until
    if (this._until) {
      this._until.subscribe(() => {
        // Remove upstream subscription
        this._unsubscribeSource()
        // Remove downstream subscriptions
        this.$.complete()
      })
    }
  }

  private _unsubscribeSource() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
  }
}

/**
 * Listen for changes on an object property
 * @example
 * class MyComponent {
 * 		text = ''
 * 		constructor() {
 * 			onChange(this, 'text', value => {
 *				console.log(`called when text changes`)
 *			})
 * 		}
 * }
 */
export function onChange<C, K extends keyof C>(
  object: C,
  key: K,
  func: (value: C[K]) => void,
  transformValue?: (value: any, oldValue: any) => any | undefined
) {
  let storedValue: C[K] = object[key]

  Object.defineProperty(object, key, {
    get: () => {
      return storedValue
    },
    set: newValue => {
      let res = undefined
      if (transformValue) {
        res = transformValue(newValue, storedValue as any)
      }
      if (res === undefined) {
        storedValue = newValue
      } else {
        storedValue = res
      }

      if (func) {
        func(storedValue)
      }
    },
  })
}

/**
 * Listens for changes on a property and exposes it as an Observable.
 * Replaces the property with a getter/setter so it can detect changes.
 *
 * Example: listens for a property `text` and creates an Observable `$text`.
 * ```ts
 * this.text = 'blabla'
 * this.$text = new BehaviorSubject(null)
 * makeObservable(this, 'text', '$text')
 * ```
 */
export function makeObservable<T, K extends keyof T>(_component: T, key: K, observableKey: K) {
  const component = _component as any

  // Emit initial value
  component[observableKey].next(component[key])

  // Emit following values
  onChange(component, key, value => {
    component[observableKey].next(value)
  })
}

/**
 * Listens for changes on a property and exposes it as a Signal.
 * Replaces the property with a getter/setter so it can detect changes.
 *
 * Example: listens for a property `text` and creates a Signal `$text`.
 * ```ts
 * this.text = 'blabla'
 * this.$text = signal(null)
 * makeSignal(this, 'text', '$text')
 * ```
 */
export function makeSignal<T, K extends keyof T>(_component: T, key: K, signalKey: K) {
  const component = _component as any

  // Emit initial value
  component[signalKey].set(component[key])

  // Emit following values
  onChange(component, key, value => {
    component[signalKey].set(value)
  })
}

export function inputSignal<T, K extends keyof T>(_component: T, key: K) {
  const component = _component as any
  onChange(component, key, value => {
    if (isSignal(value)) {
      return value
    } else {
      return signal(value)
    }
  })
}

/**
 * Subscribes to an observable for the lifetime of the component.
 * @param component The subscription gets cleaned up when this component gets destroyed.
 * @param observable The observable to subscribe to.
 * @param func A function that gets called whenever the observable changes.
 */
export function subscribe<T>(
  component: Destroyable,
  observable: Observable<T>,
  func: (value: T) => void
) {
  return observable.pipe(takeUntil(component.destroy$)).subscribe(func)
}

/**
 * Subscribes to an observable and makes it into a property of the component.
 * Unsubscribes when the component gets destroyed.
 * @param component The subscription gets cleaned up when this component gets destroyed.
 * @param observable The observable to subscribe to.
 * @param key Name of the property that gets updated when the observable changes.
 */
export function makeProperty<T, K extends keyof T>(
  component: Destroyable & T,
  observable: Observable<any>,
  key: K
) {
  observable.pipe(takeUntil(component.destroy$)).subscribe(value => {
    component[key] = value
  })
}

export function derived<R, W = R>(computation: () => R, updateSource: (value: W) => void) {
  const signal = computed(computation) as unknown as WritableSignal<R>
  signal.set = value => {
    updateSource(value as unknown as W)
  }
  signal.update = updateFn => {
    const value = updateFn(signal())
    updateSource(value as unknown as W)
  }
  // signal.mutate = mutatorFn => {
  //   let value = signal()
  //   mutatorFn(value)
  //   updateSource(value)
  // }
  return signal
}

/**
 * @example
 * class MyComponent {
 * 		text = ''
 * 		constructor() {
 * 			makeIntoSignal(this, 'text')
 * 		}
 * }
 */
export function makeIntoSignal<C, K extends keyof C>(object: C, ...keys: K[]) {
  if (keys.length > 1) {
    for (const k of keys) {
      makeIntoSignal(object, k)
    }
    return
  }

  const key = keys[0]
  const value = object[key]

  let storedSignal
  if (typeof value == 'function') {
    storedSignal = computed(value as any)
  } else {
    storedSignal = signal(value)
  }

  Object.defineProperty(object, key, {
    get: () => {
      return storedSignal()
    },
    set: newValue => {
      storedSignal.set(newValue)
    },
  })
}

export function forceRefresh() {
  if (globalThis['angularZone']) {
    globalThis['angularZone'].run(() => { })
  }
}

addToGlobalRg({
  forceRefresh: forceRefresh,
})
export function propToSignal<T, K extends keyof T>(component: T, key: K) {
  const initialValue = component[key]
  const sig = signal(initialValue)

  Object.defineProperty(component, key, {
    get: () => {
      return sig()
    },
    set: newValue => {
      sig.set(newValue)
    },
  })

}
