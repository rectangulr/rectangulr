import { ElementSchemaRegistry } from '@angular/compiler'
import { COMPILER_OPTIONS, createPlatformFactory, PLATFORM_ID, PLATFORM_INITIALIZER, platformCore } from '@angular/core'
import { INTERNAL_RECTANGULR_PLATFORM_PROVIDERS } from '../../platform'

import { DOCUMENT } from '@angular/common'
import { TerminalElementSchemaRegistry } from './schema-registry'
import { Node } from '../../dom-terminal/sources/core/dom/Node'

// export const INTERNAL_RECTANGULR_PLATFORM_PROVIDERS = [
//   { provide: PLATFORM_ID, useValue: 'rectangulr_testing' },
//   { provide: PLATFORM_INITIALIZER, useValue: () => { }, multi: true },
//   { provide: DOCUMENT, useValue: {}, deps: [] },
// ]

// @ts-ignore
globalThis['Node'] = Node

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
