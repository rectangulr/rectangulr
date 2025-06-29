import { merge } from '@s-libs/micro-dash'
import chokidar from 'chokidar'
import * as esbuild from 'esbuild'
import fs from 'fs/promises'
import json5 from 'json5'
import path from 'path'
import { angularPlugin, assert, E } from './esbuildPlugins'
import { checkOptions, opt } from './options'
import { Queue } from './Queue'

const scriptDir = __dirname + '/'


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
	let jit = false
	const queue = new Queue<E>()
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
			write: false,
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
			jit = false
		}

		const dev = opt('dev', false)
		if (dev) {
			mergeOptions(esbuildOptions, {
				define: {
					'ngDevMode': 'ngDevMode'
				},
				sourcemap: 'linked',
				sourcesContent: false,
				metafile: true,
			})
			watch = true
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
		if (opt('jit') !== undefined) { jit = toBoolean(opt('jit')) }
		if (opt('watch') !== undefined) { watch = toBoolean(opt('watch')) }

		// plugins.push(rebuildNotifyPlugin({
		// 	entryPoints: entryPoints,
		// 	outDir: opt('o', 'dist'),
		// 	printMetaFile: opt('meta', false),
		// 	watch: watch,
		// }))

		if (jit) {
			mergeOptions(esbuildOptions, {
				inject: [
					...esbuildOptions.inject ?? [],
					path.resolve(scriptDir, '../files/inject-compiler.js'),
				]
			})
		} else {
			const angular = angularPlugin({ tsconfig: opt('tsconfig', 'tsconfig.json') }, queue)
			plugins.push(angular)
		}

		if (opt('customEsbuild')) {
			mergeOptions(esbuildOptions, {
				...json5.parse(opt('customEsbuild', {})),
			})
		}

		mergeOptions(esbuildOptions, { plugins })

		if (opt('print', false)) {
			console.log(esbuildOptions)
			console.log({ watch, jit, useRequire, prod, target })
			process.exit(0)
		}

		esbuildCtx = await esbuild.context(esbuildOptions)

		const watcher = chokidar.watch([], { ignoreInitial: true })
		if (watch) {
			watcher.on('all', (event, path) => {
				queue.send({ type: 'fileChange', path })
			})
		}

		queue.subscribe(async event => {
			if (event.type == 'bundle') {
				await bundle()
			} else if (event.type == 'watchFile') {
				batchWatch(event.path)
			} else if (event.type == 'fileChange') {
				batchFileChange(event.path)
			}
		})

		// queue.subscribe(async event => {
		// 	console.log(event)
		// })

		let filesToWatch: string[] = []
		let watchTimeout: NodeJS.Timeout | null = null
		function batchWatch(filePath: string) {
			filesToWatch.push(filePath)
			if (watchTimeout) clearTimeout(watchTimeout)
			watchTimeout = setTimeout(() => {
				watcher.add(filesToWatch)
				filesToWatch = []
				watchTimeout = null
			}, 100)
		}

		let filesThatChanged = new Set<string>()
		let fileChangeTimeout: NodeJS.Timeout | null = null
		function batchFileChange(filePath: string) {
			filesThatChanged.add(filePath)
			if (fileChangeTimeout) clearTimeout(fileChangeTimeout)
			fileChangeTimeout = setTimeout(async () => {
				if (filesThatChanged.size > 0) {
					console.log('Compile files:', filesThatChanged)
					queue.send({ type: 'invalidate', files: [...filesThatChanged] })
					queue.send({ type: 'bundle' })
					filesThatChanged.clear()
				}
				fileChangeTimeout = null
			}, 100)
		}

	}

	/**
	 * Start build
	 */
	const res = await bundle()
	if (watch == false) {
		process.exit(res)
	}

	async function bundle() {
		const res = await esbuildCtx.rebuild()
		if (res.errors.length) {
			console.error('Build failed with errors:')
			for (const err of res.errors) {
				console.error(err)
			}
			return 1
		} else {
			if (res.outputFiles) {
				for (const file of res.outputFiles) {
					await fs.mkdir(path.dirname(file.path), { recursive: true })
					await fs.writeFile(file.path, file.contents)
					const size = formatFileSize(file.contents.length)
					console.log('Write', file.path, `(${size})`)
				}
				if (opt('printMetaFile')) {
					assert(res.metafile)
					const meta = await esbuild.analyzeMetafile(res.metafile)
					console.log(meta)
					await fs.writeFile('meta.json', JSON.stringify(res.metafile))
					console.log('meta saved: meta.json')
				}
			}
			return 0
		}
	}

}

function formatFileSize(bytes: number): string {
	const units = ['B', 'KB', 'MB', 'GB', 'TB']
	let size = bytes
	let unitIndex = 0

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024
		unitIndex++
	}

	return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
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
