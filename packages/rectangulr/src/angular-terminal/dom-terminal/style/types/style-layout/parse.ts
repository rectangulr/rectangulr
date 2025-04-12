export type ValueOrAuto = 'auto' | number | `${number}%`

export function parseValueOrAuto(value: string | number): ValueOrAuto {
	if (value === 'auto') return 'auto'
	if (typeof value === 'number') return value
	return value as `${number}%`
}


export type ValueOrUndefined = undefined | number | `${number}%`

export function parseValueOrUndefined(value: string | number): ValueOrUndefined {
	if (value === 'auto') return undefined
	if (typeof value === 'number') return value
	return value as `${number}%`
}

export type Value = number | `${number}%`

export function parseValue(value: string | number): Value {
	if (typeof value === 'number') return value
	return value as `${number}%`
}
