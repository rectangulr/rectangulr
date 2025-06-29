import { argv } from 'zx'

export type Option = { id: string, description: string, defaultValue: any }

export const opts: { [k: string]: { id: string, description: string } } = {
	'i': { id: 'i', description: 'Input files' },
	'o': { id: 'o', description: 'Output directory' },
	'jit': { id: 'jit', description: `Inject @angular/compiler and use it at runtime` },
	'tsconfig': { id: 'tsconfig', description: 'Tsconfig path' },
	'meta': { id: 'meta', description: 'Enable esbuild bundle size analyzer' },
	'watch': { id: 'watch', description: 'Watch mode' },
	'prod': { id: 'prod', description: 'Production mode' },
	'dev': { id: 'prod', description: 'Dev mode' },
	'sourcemap': { id: 'sourcemap', description: 'Enable sourcemaps' },
	'help': { id: 'help', description: 'Print the options' },
	'customEsbuild': { id: 'customEsbuild', description: 'Custom esbuild options' },
	'target': { id: 'target', description: 'Target platform: (web/node)' },
	'print': { id: 'print', description: 'Print esbuild options and exit' },
	'useRequire': { id: 'useRequire', description: 'Inject require shim (CJS compatibility)' },
}

export function opt(name: keyof typeof opts, defaultValue: any = undefined) {
	const value = argv[name]
	if (value === undefined) {
		return defaultValue
	} else {
		if (value == 'false') {
			return false
		} else if (value == 'true') {
			return true
		}
		return value
	}
}

export function checkOptions(): 'error' | 'ok' | 'help' {
	if (opt('help', false)) {
		console.log('Options:')
		for (const [name, opt] of Object.entries(opts)) {
			console.log(`  --${name}: ${opt.description}`)
		}
		return 'help'
	}

	const unknownOptions = Object.keys(argv).filter(key => !(key in opts) && key != '_')
	if (unknownOptions.length > 0) {
		console.error('Unknown options:', unknownOptions.join(', '))
		return 'error'
	}

	console.log('Build options:')
	for (const key of Object.keys(opts)) {
		const key2 = key as keyof typeof opts
		const value = opt(key2)
		const description = opts[key2].description
		if (value !== undefined) {
			console.log(`  ${description} (${key}): ${value}`)
		}
	}
	// console.log('  Defaults:')
	// for (const key of Object.keys(opts)) {
	// 	const key2 = key as keyof typeof opts
	// 	const value = opt(key2)
	// 	const description = opts[key2].description
	// 	const isDefault = value === opts[key2].default
	// 	if (isDefault) {
	// 		console.log(`    ${description} (${key}): ${value}`)
	// 	}
	// }
	return 'ok'
}
