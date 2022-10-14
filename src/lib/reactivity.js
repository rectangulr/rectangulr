"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceRefresh = exports.onChangeEmit = exports.onChange = exports.State = void 0;
const rxjs_1 = require("rxjs");
const utils_1 = require("./utils");
/**
 * A piece of reactive state. The changes can be subscribed to, and built upon.
 * Similar to a BehaviorSubject but:
 * 	- the source of new values can be changed while retaining the local value and downstream subscriptions
 * 	- it's easy to unsubscribe upstream/downstream when the component is destroyed
 */
class State {
    constructor(defaultValue, until = null, source = null) {
        this.$ = new rxjs_1.BehaviorSubject(defaultValue);
        this.value = defaultValue;
        this.subscribeSource(source);
        this.until(until);
    }
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        this.changed();
    }
    changed() {
        this.$.next(this.value);
    }
    /**
     * Sets the source of new values
     * @param source An observable providing the new values or a plain value
     */
    subscribeSource(source) {
        this.source = source;
        this._unsubscribeSource();
        // Subscribe to the new source if observable
        if (rxjs_1.isObservable(this.source)) {
            this.subscription = this.source.subscribe(value => {
                this.value = value;
            });
        }
        else {
            this.value = this.source;
        }
    }
    /**
     *
     * @param until An observable.
     */
    until(until) {
        this._until = until;
        if (this._until) {
            this._until.subscribe(() => {
                // Remove upstream subscription
                this._unsubscribeSource();
                // Remove downstream subscriptions
                this.$.complete();
            });
        }
    }
    _unsubscribeSource() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }
}
exports.State = State;
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
function onChange(object, key, func, transformValue) {
    let storedValue = object[key];
    Object.defineProperty(object, key, {
        get: () => {
            return storedValue;
        },
        set: newValue => {
            let res = undefined;
            if (transformValue) {
                res = transformValue(newValue, storedValue);
            }
            if (res === undefined) {
                storedValue = newValue;
            }
            else {
                storedValue = res;
            }
            if (func) {
                func(storedValue);
            }
        },
    });
}
exports.onChange = onChange;
/**
 * Listen for changes on an object property and expose it as an Observable.
 * Example: listen for a component property `text` and create an Observable `textChange`.
 * ```ts
 * this.text = 'blabla'
 * this.textChange = new BehaviorSubject(null)
 * onChangeEmit(this, 'text', 'textChange')
 * ```
 */
function onChangeEmit(_object, key, observableKey) {
    const object = _object;
    // Emit initial value
    object[observableKey].next(object[key]);
    // Emit following values
    onChange(object, key, value => {
        object[observableKey].next(value);
    });
}
exports.onChangeEmit = onChangeEmit;
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
function forceRefresh() {
    globalThis['angularZone'].run(() => { });
}
exports.forceRefresh = forceRefresh;
utils_1.addToGlobal({
    forceRefresh,
});
