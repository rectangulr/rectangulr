import { $ } from 'zx'

main()
async function main() {
	await $`npm i`
	await $`npm run build`
	await $`npm run test`
}
