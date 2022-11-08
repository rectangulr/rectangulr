import { BehaviorSubject, isObservable, Observable, Subscription } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { Destroyable } from './mixins'
import { addToGlobal } from './utils'

/**
 * A piece of reactive state. The changes can be subscribed to, and built upon.
 * Similar to a BehaviorSubject but:
 * 	- the source of new values can be changed while retaining the local value and downstream subscriptions
 * 	- it's easy to unsubscribe upstream/downstream when the component is destroyed
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
export function onChange<T, K extends keyof T>(
  object: T,
  key: K,
  func: (value) => void,
  transformValue?: (value: T, oldValue: T) => any | undefined
) {
  let storedValue = object[key]

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
 * Listen for changes on an object property and expose it as an Observable.
 * Replaces the property with a getter/setter so we can detect changes.
 *
 * Example: listen for a component property `text` and create an Observable `$text`.
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

export function subscribeValue<T, K extends keyof T>(
  component: Destroyable & T,
  observable: Observable<any>,
  key: K
) {
  observable.pipe(takeUntil(component.destroy$)).subscribe(value => {
    component[key] = value
  })
}

export function subscribe<T>(
  component: Destroyable,
  observable: Observable<T>,
  func: (value: T) => void
) {
  observable.pipe(takeUntil(component.destroy$)).subscribe(func)
}

// export function onChangeSubscribe<T extends Destroyable, K extends keyof T>(object: T, key: K, observableKey: K) {
// 	const obj = object as any

// 	// Emit initial value
// 	obj[observableKey].next(object[key])

// 	// Emit following values
// 	onChange(obj, key, value => {
// 		if (isObservable(value)) {
// 			// unsubscribe
// 			// subscribe
// 		}
// 		obj[observableKey].next(value)
// 	})

// }

// export class RxValue<T> extends Subject<T> {
//   constructor(private _value: T) {
//     super()
//   }

//   get value(): T {
//     return this._value
//   }
//   set value(value: T) {
//     this._value = value
//   }

//   next(value: T): void {
//     this._value = value
//     super.next(value)
//   }
// }

// export function awaitAndRefresh() {}

export function forceRefresh() {
  globalThis['angularZone'].run(() => {})
}

addToGlobal({
  forceRefresh: forceRefresh,
})
