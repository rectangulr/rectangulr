import { BehaviorSubject, isObservable, Observable, Subject, Subscription } from 'rxjs'

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

    if (source) {
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
export function onChange(
  object,
  key,
  func: (value) => void,
  transformValue?: (value, oldValue) => any | undefined
) {
  let storedValue = object[key]

  Object.defineProperty(object, key, {
    get: () => {
      return storedValue
    },
    set: newValue => {
      let res = undefined
      if (transformValue) {
        res = transformValue(newValue, storedValue)
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
 * Listen for changes on an object property and expose it as an EventEmitter.
 * Example: listen for a component property `text` and create an EventEmitter `textChange`.
 * ```ts
 * onChangeEmit(this, 'text', 'textChange')
 * ```
 */
export function onChangeEmit<T, K extends keyof T>(object: T, key: K, observableKey: K) {
  const obj = object as any

  // Emit initial value
  obj[observableKey].next(object[key])

  // Emit following values
  onChange(obj, key, value => {
    obj[observableKey].next(value)
  })
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
