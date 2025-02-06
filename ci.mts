import { $ } from 'zx'

(process as any).env.FORCE_COLOR = 3
$.verbose = true

await $`cd packages/rectangulr &&
 npm i &&
 npx tsx dev/ci.mts`

await $`cd packages/buildr &&
 npm i &&
 npx tsx dev/ci.mts`

await $`cd packages/smoke-test &&
 npm i &&
 npx tsx dev/ci.mts`
