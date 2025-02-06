import * as esbuild from 'esbuild'
import { angularPlugin, rebuildNotifyPlugin } from './esbuildPlugins'
import { checkOptions, opt } from './options'

main()
async function main() {

	/**
	 * Command-line options
	 */
	{
		const optionsRes = checkOptions()
		if (optionsRes == 'help') process.exit(0)
		if (optionsRes == 'error') process.exit(1)
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
	 * Esbuild context
	 */
	let ctx: esbuild.BuildContext
	{
		ctx = await esbuild.context({
			entryPoints: opt('_'),
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
			// target: 'node18',

			// external: nodeBuiltins,
			format: 'esm',
			define: {
				'ngDevMode': 'false'
			},

			plugins: [
				...enabledPlugins,
			],
		})
	}

	/**
	 * Start build
	 */
	{
		if (opt('watch')) {
			await ctx.watch()
		} else {
			const res = await ctx.rebuild()
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