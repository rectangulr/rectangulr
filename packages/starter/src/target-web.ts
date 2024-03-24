import 'zone.js'

// @ts-ignore
globalThis['process'] = {
	env: {
		TERM: 'xterm',
		TERM_FEATURES: '\btrue-colors\b',
		COLORTERM: 'truecolor',
	}
}

// @ts-ignore
globalThis['setImmediate'] = (func) => {
	setTimeout(func, 0)
}
