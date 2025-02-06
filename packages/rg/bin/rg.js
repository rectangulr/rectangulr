#!/usr/bin/env node

import { register } from 'tsx/esm/api'

register()
debugger

await import('../src/build.mts')
