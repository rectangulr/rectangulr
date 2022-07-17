// (globalThis as any).__Zone_disable_nextTick = true
import 'zone.js/dist/zone-node'
// import 'zone.js/dist/zone-patch-rxjs'

import { DOCUMENT } from '@angular/common'
import { ElementSchemaRegistry } from '@angular/compiler'
import { COMPILER_OPTIONS, createPlatformFactory, Sanitizer } from '@angular/core'
// import { platformBrowserDynamic as basePlatform } from '@angular/platform-browser-dynamic';
import { platformBrowser as basePlatform } from '@angular/platform-browser'
import { TerminalSanitizer } from './sanitizer'
import { TerminalElementSchemaRegistry } from './schema-registry'
import { patchGlobalConsole } from './logger'
import { registerGlobalNgtDebug } from './debug'

export const platformTerminal = createPlatformFactory(basePlatform, 'terminal', [
    { provide: DOCUMENT, useValue: {} },
    { provide: Sanitizer, useClass: TerminalSanitizer, deps: [] },
    {
        provide: COMPILER_OPTIONS,
        useValue: {
            providers: [
                // Only used in JIT mode
                { provide: ElementSchemaRegistry, useClass: TerminalElementSchemaRegistry },
            ],
        },
        multi: true,
    },
])

patchGlobalConsole()
registerGlobalNgtDebug()
