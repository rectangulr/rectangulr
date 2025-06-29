import { $ } from 'zx'

(process as any).env.FORCE_COLOR = 3
$.verbose = true

await $`cd packages/rg &&
 bun i &&
 bun dev/build.mts`

await $`cd packages/rectangulr &&
 bun i &&
 bun dev/ci.mts`

await $`cd packages/buildr &&
 bun i &&
 bun dev/ci.mts`

await $`cd packages/smoke-test &&
 bun i &&
 bun dev/ci.mts`

await $`cd packages/starter &&
 bun i &&
 bun dev/ci.mts`

await $`cd packages/website &&
 bun i &&
 bun dev/build.mts`
