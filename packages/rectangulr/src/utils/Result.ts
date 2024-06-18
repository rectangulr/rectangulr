export class ResultClass<TValue, TError> {
	constructor(public ok: TValue, public err: TError) { }

	Ok() {
		if (this.err) throw this.err
		return this.ok
	}

	[Symbol.iterator]() {
		const values = [this.ok, this.err]
		let index = 0

		return {
			next() {
				if (index < values.length) {
					return { value: values[index++], done: false }
				} else {
					return { value: undefined, done: true }
				}
			},
		}
	}
}

export type Result<TValue, TError> =
	({ ok: TValue, err: undefined } | { ok: undefined, err: TError })
	& ([TValue, undefined] | [undefined, TError])
	& { Ok(): TValue }

export function Ok<T>(value: T): Result<T, any> {
	return new ResultClass(value, undefined) as any
}

export function Err<T>(err: T) {
	return new ResultClass(undefined, err) as any
}
