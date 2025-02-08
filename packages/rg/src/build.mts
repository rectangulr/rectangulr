import * as esbuild from 'esbuild'
import { angularPlugin, rebuildNotifyPlugin } from './esbuildPlugins'
import { checkOptions, opt } from './options'
import json5 from 'json5'

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
	let enabledPlugins: esbuild.Plugin[] = []
	{
		enabledPlugins.push(rebuildNotifyPlugin({
			outDir: opt('o'),
			printMetaFile: opt('meta')
		}))
		if (opt('aot')) {
			enabledPlugins.push(angularPlugin({ tsconfig: opt('tsconfig') }))
		}
		console.log(`\n  Enabled plugins: ${enabledPlugins.map(p => p.name).join(', ')}`)
	}

	/**
	 * Esbuild build options
	 */
	let buildOptions: esbuild.BuildOptions
	let buildCtx: esbuild.BuildContext
	{
		buildOptions = {
			entryPoints: opt('i'),
			outdir: opt('o'),
			outExtension: { '.js': '.mjs' },
			mainFields: ['module', 'browser', 'main'],
			bundle: true,
			treeShaking: true,
			minify: false,
			logLevel: 'info',
			metafile: opt('meta'),
			sourcemap: opt('sourcemap') ? 'linked' : false,
			legalComments: 'none',
			platform: 'node',
			format: 'esm',
			define: {
				'ngDevMode': 'false'
			},
			plugins: [
				...enabledPlugins,
			],
		}
		if (opt('dev')) {
			buildOptions = {
				...buildOptions,
				define: { ...buildOptions.define, 'ngDevMode': 'ngDevMode' },
			}
		}
		if (opt('target') == 'web') {
			buildOptions = {
				...buildOptions,
				// platform: 'browser',
				outdir: 'dist-web',
				define: {
					...buildOptions.define,
					'RECTANGULR_TARGET': '"web"',
					'process': JSON.stringify({
						env: {
							TERM: 'xterm-256color',
						}
					}, null, 2),
				},
			}
		}
		if (opt('customEsbuild')) {
			buildOptions = {
				...buildOptions,
				...json5.parse(opt('customEsbuild')),
			}
		}

		if (opt('printOptions')) {
			console.log(buildOptions)
			process.exit(0)
		}

		buildCtx = await esbuild.context(buildOptions)
	}

	/**
	 * Start build
	 */
	{
		if (opt('watch')) {
			await buildCtx.watch()
		} else {
			const res = await buildCtx.rebuild()
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