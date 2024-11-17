export class Deferred<T> {
	resolve: ((value: T | PromiseLike<T>) => void) | undefined
	reject: ((reason?: any) => void) | undefined
	promise: Promise<T>
	value: any = undefined
	constructor() {
		this.promise = new Promise<T>((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
		})
	}
}
