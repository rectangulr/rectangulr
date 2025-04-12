export function mergeDeep<T>(object: T, other: Partial<T>): T {
	const result = { ...object }

	for (const key in other) {
		if (Array.isArray(result[key]) && Array.isArray(other[key])) {
			result[key] = [...result[key], ...other[key]] as T[Extract<keyof T, string>]
		} else if (other[key] !== null && typeof other[key] === 'object') {
			result[key] = mergeDeep(result[key], other[key])
		} else {
			result[key] = other[key]
		}
	}

	return result
}
