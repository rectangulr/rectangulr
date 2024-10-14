import { filter, from } from 'rxjs'
import { $, argv } from 'zx'
import { Buildr } from '@rectangulr/buildr'
$.verbose = true

console.log(argv)
const { call } = new Buildr()

const target = {
	dist: 'rg',
	polyfills: '--polyfills src/target-node.ts',
}

if (argv['clean']) {
	await $`rm -r dist ${target.dist}`.nothrow()
}

call(() => {
	(process as any).env.FORCE_COLOR = 3
	const polyfills = target.polyfills.split(' ')
	if (argv['watch']) {
		const angular = $`npx ng build ${polyfills} --watch`
		return from(angular.stdout).pipe(filter((line: string) => line.toString().includes('complete')))
	} else {
		return $`npx ng build ${polyfills}`
	}
}).then(async () => {
	await new Promise(res => setTimeout(() => res(null), 1000))
	await $`mkdir -p ${target.dist}`
	await $`npx esbuild dist/browser/main.js --inject:dist/browser/polyfills.js --bundle --platform=node --outfile=${target.dist}/main.cjs`

	console.log(`Done building: ${new Date().toLocaleTimeString()}`)
})
