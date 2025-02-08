export { }

declare global {
	var RECTANGULR_TARGET: 'web' | 'node' | (string & {})
}

if (!('RECTANGULR_TARGET' in globalThis)) {
	globalThis['RECTANGULR_TARGET'] = 'node'
}
