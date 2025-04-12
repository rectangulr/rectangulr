import { $ } from 'zx'

(process as any).env.FORCE_COLOR = 3
$.verbose = true

await $`npm run build`
await $`npm run web`
// await $`npm run test`
