/**
 * @example
 * assert(false, "throw this error message")
 * assert(true, "nothing happens")
 */

export function assert(condition?: any, message?: string): asserts condition {
	if (!condition) {
		throw new Error(message || 'assert failed')
	}
}
