import { CreateComputedOptions, CreateSignalOptions, InputSignal, Signal, WritableSignal, computed, signal } from '@angular/core'
import { assert } from './Assert'
import { initial } from 'lodash'

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
	patchWritableSignal(sig)
	return sig as Signal2<T>
}

export function patchWritableSignal<T>(sig: WritableSignal<T>): Signal2<T> {
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
				originalSet.call(sig, value)
				subscribers.forEach(subscriber => subscriber(value))
			}
		}
	})

	const originalUpdate = sig.update
	Object.defineProperty(sig, 'update', {
		get() {
			return (func: any) => {
				originalUpdate.call(sig, func)
				subscribers.forEach(subscriber => subscriber(func(sig())))
			}
		}
	})

	const subscribers: ((value: T) => void)[] = []

	Object.defineProperty(sig, 'subscribe', {
		get() {
			return (callback: any) => {
				subscribers.push(callback)
				callback(sig())
				return () => {
					const index = subscribers.indexOf(callback)
					subscribers.splice(index, 1)
				}
			}
		},
	})

	return sig as Signal2<T>
}

export function computed2<T>(computation: () => T, options?: CreateComputedOptions<T>): Computed2<T> {
	const sig = computed(computation, options)
	patchComputed<T>(sig)
	return sig as Computed2<T>
}

export function patchComputed<T>(sig: Signal<T>) {
	Object.defineProperty(sig, '$', {
		get() {
			return sig()
		}
	})
	return sig as Computed2<T>
}

export type InputSignal2<T> = InputSignal<T> & {
	subscribe(callback: (value: T) => void, options?: { initial: boolean }): () => void
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
		before(...args)
		subscribers.forEach(subscriber => subscriber(value))
	}

	Object.defineProperty(input, 'subscribe', {
		get() {
			return (callback: (value: T) => void, options?: { initial: boolean }) => {
				const options2 = { initial: true, ...options }
				subscribers.push(callback)
				if (options2.initial) {
					callback(input())
				}
				return () => {
					const index = subscribers.indexOf(callback)
					subscribers.splice(index, 1)
				}
			}
		},
	})

	return input as InputSignal2<T>
}