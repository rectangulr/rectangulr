import { $ } from 'zx'
import esbuild from 'esbuild'
$.verbose = true

await $`mkdir -p dist`

// // Bundle compiler-plugin.js
// await esbuild.build({
// 	entryPoints: ['src/angular-build/src/tools/esbuild/angular/compiler-plugin.ts'],
// 	outfile: 'dist/compiler-plugin.js',
// 	platform: 'node',
// 	format: 'cjs',
// 	bundle: true,
// 	treeShaking: true,
// 	plugins: [
// 		{
// 			name: 'replace-compiler-plugin',
// 			setup(build) {
// 				build.onResolve({ filter: /^compiler-plugin\.js$/ }, args => {
// 					return {
// 						path: require('path').resolve('src/compiler-plugin.js'),
// 					}
// 				})
// 			},
// 		},
// 		// Print every loaded file
// 		// {
// 		// 	name: 'log-loaded-files',
// 		// 	setup(build) {
// 		// 		build.onLoad({ filter: /.*/ }, args => {
// 		// 			console.log(`Loaded file: ${args.path}`)
// 		// 			return null
// 		// 		})
// 		// 	},
// 		// },
// 	],
// })

await esbuild.build({
	entryPoints: ['src/angular-build/src/tools/angular/compilation/parallel-worker.ts'],
	outfile: 'dist/parallel-worker.js',
	platform: 'node',
	format: 'cjs',
	bundle: true,
	treeShaking: true,
	external: ['../../node_modules/*']
})

await esbuild.build({
	entryPoints: ['src/angular-build/src/tools/esbuild/javascript-transformer-worker.ts'],
	outfile: 'dist/javascript-transformer-worker.js',
	platform: 'node',
	format: 'cjs',
	bundle: true,
	treeShaking: true,
	external: ['../../node_modules/*']
})

await esbuild.build({
	entryPoints: ['src/main.ts'],
	outdir: 'dist',
	outExtension: { '.js': '.cjs' },
	platform: 'node',
	format: 'cjs',
	bundle: true,
	external: ['../../node_modules/*']
})

await $`ls -lah dist/`
