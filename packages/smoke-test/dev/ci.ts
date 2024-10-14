import { $ } from 'zx'

main()
async function main() {
	await $`cp -r ../rectangulr/dist ./private/rectangulr`
	await $`npm link ./private/rectangulr ../buildr`
	await $`npm run build`
	await $`npm run test`
}
