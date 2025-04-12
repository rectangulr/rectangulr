import { argv } from 'zx'

export type Option = { id: string, description: string, default: any }

export const opts: { [k: string]: { id: string, description: string, default: any } } = {
	'i': { id: 'i', description: 'Input files', default: 'src/main.ts', },
	'o': { id: 'o', description: 'Output directory', default: 'dist' },
	'aot': { id: 'aot', description: `AOT: if true(AOT), if false(inject @angular/compiler) and use at runtime`, default: undefined },
	'tsconfig': { id: 'tsconfig', description: 'Tsconfig path', default: 'tsconfig.json' },
	'meta': { id: 'meta', description: 'Enable esbuild bundle size analyzer', default: false },
	'watch': { id: 'watch', description: 'Watch mode', default: undefined },
	'prod': { id: 'prod', description: 'Production mode', default: false },
	'sourcemap': { id: 'sourcemap', description: 'Enable sourcemaps', default: undefined },
	'help': { id: 'help', description: 'Print the options', default: false },
	'customEsbuild': { id: 'customEsbuild', description: 'Custom esbuild options', default: '{}' },
	'target': { id: 'target', description: 'Target platform: (web/node)', default: 'node' },
	'print': { id: 'print', description: 'Print esbuild options and exit', default: false },
}
export function opt(name: keyof typeof opts) {
	if (argv[name] === undefined) {
		if ('default' in opts[name]) {
			return opts[name].default
		} else {
			return undefined
		}
	} else {
		return argv[name]
	}
}

export function checkOptions(): 'error' | 'ok' | 'help' {
	if (opt('help')) {
		console.log('Options:')
		for (const [name, opt] of Object.entries(opts)) {
			console.log(`  --${name}: ${opt.description} (default: ${opt.default})`)
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
		const isDefault = value === opts[key2].default
		if (!isDefault) {
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
