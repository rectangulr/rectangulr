import { ElementSchemaRegistry } from '@angular/compiler'
import { COMPILER_OPTIONS, createPlatformFactory, platformCore } from '@angular/core'
import { INTERNAL_RECTANGULR_PLATFORM_PROVIDERS } from '../platform'
import { TerminalElementSchemaRegistry } from '../schema-registry'

export const platformRectangulrDynamicTesting = createPlatformFactory(
  platformCore,
  'rectangulrDynamicTesting',
  [
    ...INTERNAL_RECTANGULR_PLATFORM_PROVIDERS,
    {
      provide: COMPILER_OPTIONS,
      useValue: {
        providers: [
          { provide: ElementSchemaRegistry, useClass: TerminalElementSchemaRegistry }, // Only used in JIT mode
        ],
      },
      multi: true,
    },
  ]
)
