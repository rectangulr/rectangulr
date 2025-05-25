import { Directive, inject, Injector, input, ProviderToken, signal, Type } from "@angular/core"
import { assert } from './utils/Assert'

/**
 * A directive to get a reference to a view child
 */
@Directive({
	selector: '[ref]',
	standalone: true
})
export class Ref<T> {
	ref = input<ViewQuery<T>>()
	injector = inject(Injector)
	injected: T | undefined

	constructor() {
		setTimeout(() => {
			assert(this.ref())
			this.injected = this.injector.get(this.ref()!.type)
			this.ref()!.signal.set(this.injected)
		}, 20)
	}

	ngOnInit() {
		debugger
	}

	ngOnDestroy() {
		assert(this.ref())
		this.ref()!.signal.set(undefined)
	}
}

export function viewRef<T>(type: Type<T>) {
	return new ViewQuery<T>(type)
}

class ViewQuery<T> {
	signal = signal<T | undefined>(undefined)
	type: ProviderToken<T>

	constructor(type: Type<T>) {
		this.type = type
	}

	get $() {
		return this.signal()
	}
}
