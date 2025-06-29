import * as esbuild from 'esbuild'
import { type Plugin } from 'esbuild'
import { fs } from 'zx'
import { createCompilerPlugin } from './angular-build/src/tools/esbuild/angular/compiler-plugin'
import { Queue } from './Queue'

export type E =
	{ type: 'watchFile', path: string } |
	{ type: 'fileChange', path: string } |
	{ type: 'invalidate', files: string[] } |
	{ type: 'bundle' }

export function angularPlugin(args: { tsconfig: string }, queue: Queue<E>): Plugin {

	const plugin = createCompilerPlugin({
		sourcemap: false,
		tsconfig: args.tsconfig,
		incremental: false,
		// @ts-ignore
		browserOnlyBuild: true,
		// @ts-ignore
		// advancedOptimizations: true,
	}, queue)

	return plugin
}

export function rebuildNotifyPlugin(args: {
	entryPoints: string[],
	outDir: string,
	printMetaFile: boolean,
	watch: boolean,
}): Plugin {
	return {
		name: 'rebuild-notify',
		setup(build) {
			build.onEnd(async result => {
				if (result.errors.length > 0) {
					console.error('Build failed:', result.errors)
				} else {
					console.log(`Build succeeded: ${args.outDir}`)
					if (args.watch) {
						console.log(`Watching ${args.entryPoints}...`)
					}
					if (args.printMetaFile) {
						assert(result.metafile)
						const meta = await esbuild.analyzeMetafile(result.metafile)
						console.log(meta)
						fs.writeFileSync('meta.json', JSON.stringify(result.metafile))
						console.log('meta saved: meta.json')
					}
					// console.log((await $`ls -lh ${args.outDir}`).stdout)
				}
			})
		},
	}
}

/**
 * @example
 * assert(false, "throw this error message")
 * assert(true, "nothing happens")
 */
export function assert(condition?: any, message?: string): asserts condition {
	if (!condition) {
		throw new Error(message || 'assert failed')
	}
}
