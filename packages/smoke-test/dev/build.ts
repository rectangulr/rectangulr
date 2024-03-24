import { filter, from } from 'rxjs'
import { $, argv } from 'zx'
import { Buildr } from '@rectangulr/buildr'

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
	await $`cat dist/browser/polyfills.js dist/browser/main.js > ${target.dist}/main.mjs`

	console.log(`Done building: ${new Date().toLocaleTimeString()}`)
})
