import { merge } from '@s-libs/micro-dash'
import * as esbuild from 'esbuild'
import json5 from 'json5'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { angularPlugin as angularCompilerPlugin, rebuildNotifyPlugin } from './esbuildPlugins'
import { checkOptions, opt } from './options'

const scriptDir = dirname(fileURLToPath(import.meta.url)) + '/'

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
	let entryPoints: string[] = (opt('i') as string).split(',')
	let plugins: esbuild.Plugin[] = [
		rebuildNotifyPlugin({
			entryPoints: entryPoints,
			outDir: opt('o'),
			printMetaFile: opt('meta')
		})
	]

	/**
	 * Esbuild build options
	 */
	let esbuildOptions: esbuild.BuildOptions = {}
	let esbuildCtx: esbuild.BuildContext
	let watch = false
	let compiler = false
	{
		mergeOptions(esbuildOptions, {
			entryPoints: entryPoints,
			outdir: opt('o'),
			outExtension: { '.js': '.mjs' },
			mainFields: ['module', 'browser', 'main'],
			bundle: true,
			treeShaking: true,
			minify: false,
			platform: 'node',
			sourcemap: false,
			format: 'esm',
			inject: [
				scriptDir + '../files/inject-require.js',
			],
		})

		if (opt('prod')) {
			mergeOptions(esbuildOptions, {
				define: { 'ngDevMode': 'false' },
				sourcemap: false,
				minify: true,
			})
			watch = false
			compiler = false
		} else {
			mergeOptions(esbuildOptions, {
				define: {
					'ngDevMode': 'ngDevMode'
				},
				sourcemap: 'linked',
				metafile: true,
			})
			watch = true
			compiler = true
		}

		if (opt('target') == 'web') {
			mergeOptions(esbuildOptions, {
				// platform: 'browser',
				outdir: 'dist-web',
				define: {
					'RECTANGULR_TARGET': '"web"',
					'process': JSON.stringify({
						env: {
							TERM: 'xterm-256color',
						}
					}, null, 2),
				},
			})
		}

		if (opt('meta') !== undefined) esbuildOptions.metafile = opt('meta')
		if (opt('sourcemap') !== undefined) esbuildOptions.sourcemap = opt('sourcemap')

		if (opt('compiler') !== undefined) {
			compiler = opt('compiler')
		}
		if (compiler) {
			mergeOptions(esbuildOptions, {
				inject: [
					...esbuildOptions.inject ?? [],
					scriptDir + '../files/inject-compiler.js',
				]
			})
		} else {
			plugins.push(
				angularCompilerPlugin({ tsconfig: opt('tsconfig') }))
		}

		if (opt('customEsbuild')) {
			mergeOptions(esbuildOptions, {
				...json5.parse(opt('customEsbuild')),
			})
		}

		mergeOptions(esbuildOptions, { plugins })

		if (opt('print')) {
			console.log(esbuildOptions)
			console.log({ watch, compiler, plugins })
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
