import { Buildr } from '@rectangulr/buildr'
import { promises as fs } from 'fs'
import { filter, from } from 'rxjs'
import { $, argv } from 'zx'

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

	const polyfillsContent = await fs.readFile('dist/browser/polyfills.js', 'utf8')
	const mainContent = await fs.readFile('dist/browser/main.js', 'utf8')
	await fs.writeFile(
		`${target.dist}/main.mjs`,
		`(function() {\n${polyfillsContent}\n})();\n${mainContent}`,
		'utf8'
	)

	console.log(`Done building: ${new Date().toLocaleTimeString()}`)
})
