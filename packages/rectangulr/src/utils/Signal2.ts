import { CreateComputedOptions, CreateSignalOptions, InputSignal, Signal, WritableSignal, computed, signal } from '@angular/core'
import { assert } from './Assert'

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

export type InputSignal2<T> = InputSignal<T> & {
	subscribe(callback: (value: T) => void): () => void
}

export function patchInputSignal<T>(input: Signal<T>): InputSignal2<T> {
	const SIGNAL = Object.getOwnPropertySymbols(input).find(symbol => symbol.description == 'SIGNAL')
	assert(SIGNAL !== undefined)

	const subscribers: ((value: T) => void)[] = []

	// @ts-ignore
	const before = input[SIGNAL]['applyValueToInputSignal']
	// @ts-ignore
	input[SIGNAL]['applyValueToInputSignal'] = (...args) => {
		const [node, value] = args
		subscribers.forEach(subscriber => subscriber(value))
		before(...args)
	}

	Object.defineProperty(input, 'subscribe', {
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

	return input as InputSignal2<T>
}