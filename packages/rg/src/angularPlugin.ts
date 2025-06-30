import { type Plugin } from 'esbuild'
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
		incremental: true,
		browserOnlyBuild: true,
		advancedOptimizations: true,
	}, queue)

	return plugin
}
