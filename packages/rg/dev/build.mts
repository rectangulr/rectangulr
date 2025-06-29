import { $ } from 'zx'
import esbuild from 'esbuild'
$.verbose = true

await $`mkdir -p dist`

await esbuild.build({
	entryPoints: ['src/angular-build/src/tools/angular/compilation/parallel-worker.ts'],
	outfile: 'dist/parallel-worker.js',
	platform: 'node',
	bundle: true,
	treeShaking: true,
	external: ['../../node_modules/*']
})

await esbuild.build({
	entryPoints: ['src/angular-build/src/tools/esbuild/javascript-transformer-worker.ts'],
	outfile: 'dist/javascript-transformer-worker.js',
	platform: 'node',
	bundle: true,
	treeShaking: true,
	external: ['../../node_modules/*']
})

await esbuild.build({
	entryPoints: ['src/main.ts'],
	outdir: 'dist',
	platform: 'node',
	bundle: true,
	external: ['../../node_modules/*']
})

await $`ls -lah dist/`
