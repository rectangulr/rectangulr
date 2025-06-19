import { merge } from '@s-libs/micro-dash'
import * as esbuild from 'esbuild'
import json5 from 'json5'
import path from 'path'
import { fileURLToPath } from 'url'
import { angularPlugin, rebuildNotifyPlugin } from './esbuildPlugins'
import { checkOptions, opt } from './options'

const scriptDir = path.dirname(fileURLToPath(import.meta.url)) + '/'

main()
async function main() {
	/**
	 * Command-line options
	 */
	{
		const res = checkOptions()
		if (res == 'help') process.exit(0)
		if (res == 'error') process.exit(1)
	}

	/**
	 * Esbuild Plugins
	 */
	let entryPoints: string[] = (opt('i', 'src/main.ts') as string).split(',')
	let plugins: esbuild.Plugin[] = []

	/**
	 * Esbuild build options
	 */
	let esbuildOptions: esbuild.BuildOptions = {}
	let esbuildCtx: esbuild.BuildContext
	let watch = false
	let aot = true
	{
		mergeOptions(esbuildOptions, {
			entryPoints: entryPoints,
			outdir: opt('o', 'dist'),
			outExtension: { '.js': '.mjs' },
			// mainFields: ['module', 'main', 'browser'],
			bundle: true,
			treeShaking: true,
			minify: false,
			platform: 'node',
			sourcemap: false,
			format: 'esm',
			preserveSymlinks: true,
			tsconfig: path.resolve(scriptDir, '../files/tsconfig.json'),
		})

		let useRequire = false

		const prod = opt('prod', false)
		if (prod) {
			mergeOptions(esbuildOptions, {
				define: { 'ngDevMode': 'false' },
				sourcemap: false,
				minify: true,
			})
			watch = false
			aot = true
		} else {
			mergeOptions(esbuildOptions, {
				define: {
					'ngDevMode': 'ngDevMode'
				},
				sourcemap: 'linked',
				sourcesContent: false,
				metafile: true,
			})
			watch = true
			aot = false
		}

		const target = opt('target', 'node')
		if (target == 'web') {
			mergeOptions(esbuildOptions, {
				// platform: 'browser',
				outdir: opt('o', 'dist-web'),
				define: {
					'RECTANGULR_TARGET': '"web"',
					'process': JSON.stringify({
						env: {
							TERM: 'xterm-256color',
							COLORTERM: 'truecolor',
						}
					}, null, 2),
				},
			})
			useRequire = false
		} else {
			useRequire = true
		}

		if (opt('useRequire') !== undefined) { useRequire = toBoolean(opt('useRequire')) }
		if (useRequire) {
			mergeOptions(esbuildOptions, {
				inject: [
					path.resolve(scriptDir, '../files/inject-require.js'),
				],
			})
		}

		if (opt('meta') !== undefined) esbuildOptions.metafile = opt('meta')
		if (opt('sourcemap') !== undefined) esbuildOptions.sourcemap = opt('sourcemap')

		if (opt('aot') !== undefined) {
			aot = toBoolean(opt('aot'))
		}
		if (opt('watch') !== undefined) {
			watch = toBoolean(opt('watch'))
		}
		plugins.push(rebuildNotifyPlugin({
			entryPoints: entryPoints,
			outDir: opt('o', 'dist'),
			printMetaFile: opt('meta', false),
			watch
		}))
		if (aot) {
			plugins.push(
				angularPlugin({ tsconfig: opt('tsconfig', 'tsconfig.json') })
			)
		} else {
			mergeOptions(esbuildOptions, {
				inject: [
					...esbuildOptions.inject ?? [],
					path.resolve(scriptDir, '../files/inject-compiler.js'),
				]
			})
		}

		if (opt('customEsbuild')) {
			mergeOptions(esbuildOptions, {
				...json5.parse(opt('customEsbuild', {})),
			})
		}

		mergeOptions(esbuildOptions, { plugins })

		if (opt('print', false)) {
			console.log(esbuildOptions)
			console.log({ watch, aot, useRequire, prod, target })
			process.exit(0)
		}

		esbuildCtx = await esbuild.context(esbuildOptions)
	}

	/**
	 * Start build
	 */
	{
		if (watch) {
			await esbuildCtx.watch()
		} else {
			const res = await esbuildCtx.rebuild()
			if (res.errors.length) {
				console.error('Build failed with errors:')
				for (const err of res.errors) {
					console.error(err)
				}
				process.exit(1)
			} else {
				process.exit(0)
			}
		}
	}
}

function mergeOptions(options: esbuild.BuildOptions, newOptions: esbuild.BuildOptions) {
	merge(options, newOptions)
}

function toBoolean(value: string | boolean): boolean {
	if (typeof value === 'boolean') return value
	if (value === 'true') return true
	if (value === 'false') return false
	throw new Error(`Invalid boolean value: ${value}`)
}