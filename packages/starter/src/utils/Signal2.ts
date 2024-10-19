import { CreateComputedOptions, CreateSignalOptions, Signal, WritableSignal, computed, signal } from '@angular/core'

export type Signal2<T> = WritableSignal<T> & {
	get $(): T,
	set $(value: T)
	subscribe(callback: (value: T) => void): () => void
}

export type Computed2<T> = Signal<T> & {
	get $(): T
}

export function signal2<T>(initialValue: T, options?: CreateSignalOptions<T>): Signal2<T> {
	const sig = signal(initialValue, options)
	Object.defineProperty(sig, '$', {
		get() {
			return sig()
		},
		set(value) {
			sig.set(value)
		}
	})

	const originalSet = sig.set
	Object.defineProperty(sig, 'set', {
		get() {
			return (value: any) => {
				subscribers.forEach(subscriber => subscriber(value))
				originalSet.call(sig, value)
			}
		}
	})

	const originalUpdate = sig.update
	Object.defineProperty(sig, 'update', {
		get() {
			return (func: any) => {
				subscribers.forEach(subscriber => subscriber(func(sig())))
				originalUpdate.call(sig, func)
			}
		}
	})

	const subscribers: ((value: T) => void)[] = []

	Object.defineProperty(sig, 'subscribe', {
		get() {
			return (event: any) => {
				subscribers.push(event)
				return () => {
					const index = subscribers.indexOf(event)
					subscribers.splice(index, 1)
				}
			}
		},
	})

	return sig as Signal2<T>
}

export function computed2<T>(computation: () => T, options?: CreateComputedOptions<T>): Computed2<T> {
	const sig = computed(computation, options)
	Object.defineProperty(sig, '$', {
		get() {
			return sig()
		}
	})
	return sig as Computed2<T>
}
