import { createCompilerPlugin } from '@angular/build/private'
import * as esbuild from 'esbuild'
import { type Plugin } from 'esbuild'
import { $, fs } from 'zx'

export function angularPlugin(args: { tsconfig: string }) {
	const plugin = createCompilerPlugin({
		sourcemap: false,
		tsconfig: args.tsconfig,
		incremental: false,
		browserOnlyBuild: true,
		// @ts-ignore
		// advancedOptimizations: true,
	}, {} as any)
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
					await $`ls -lh ${args.outDir}`
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
