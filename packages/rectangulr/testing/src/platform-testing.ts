import { ElementSchemaRegistry, NO_ERRORS_SCHEMA } from '@angular/compiler'
import { COMPILER_OPTIONS, createPlatformFactory, platformCore } from '@angular/core'
import { TerminalElementSchemaRegistry } from './schema-registry'
import { ɵINTERNAL_RECTANGULR_PLATFORM_PROVIDERS, ɵNode } from '@rectangulr/rectangulr'

// @ts-ignore
globalThis['Node'] = ɵNode

export const platformRectangulrDynamicTesting = createPlatformFactory(
  platformCore,
  'rectangulrDynamicTesting',
  [
    ...ɵINTERNAL_RECTANGULR_PLATFORM_PROVIDERS,
    {
      provide: COMPILER_OPTIONS,
      useValue: {
        // providers: [
        // { provide: ElementSchemaRegistry, useClass: TerminalElementSchemaRegistry }, // Only used in JIT mode
        // ],
      },
      multi: true,
    },
  ]
)
