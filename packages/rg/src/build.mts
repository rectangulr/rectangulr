#!/usr/bin/env -S tsx
// #!/usr/bin/env -S node --experimental-strip-types

import * as esbuild from 'esbuild'
import { angularPlugin, rebuildNotifyPlugin } from './esbuildPlugins.ts'
import { checkOptions, opt } from './options.ts'
import json5 from 'json5'

main()
async function main() {
	const optionsRes = checkOptions()
	if (optionsRes == 'help') process.exit(0)
	if (optionsRes == 'error') process.exit(1)

	const enabledPlugins = []
	enabledPlugins.push(rebuildNotifyPlugin({
		outDir: opt('o'),
		printMetaFile: opt('meta')
	}))
	if (opt('aot')) {
		enabledPlugins.push(angularPlugin({ tsconfig: opt('tsconfig') }))
	}
	console.log(`\n  Enabled plugins: ${enabledPlugins.map(p => p.name).join(', ')}`)

	const customEsbuildOptions = json5.parse(opt('customEsbuild'))
	const ctx = await esbuild.context({
		entryPoints: opt('_'),
		outdir: opt('o'),
		outExtension: { '.js': '.mjs' },
		mainFields: ['module', 'browser', 'main'],
		bundle: true,
		treeShaking: true,
		minify: false,
		logLevel: 'info',
		metafile: opt('meta'),
		sourcemap: opt('sourcemap'),
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
		...customEsbuildOptions
	})

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