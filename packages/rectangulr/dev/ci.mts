import { $ } from 'zx'

(process as any).env.FORCE_COLOR = 3
$.verbose = true

await $`bash dev/checks-source.sh`
await $`npm run build`
await $`bash dev/checks-build.sh`
await $`npm run test`
