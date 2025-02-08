import { COMPILER_OPTIONS, createPlatformFactory, platformCore } from '@angular/core'
import { Node } from '../../angular-terminal/dom-terminal'
import { INTERNAL_RECTANGULR_PLATFORM_PROVIDERS } from '../../angular-terminal/platform'
import { REDIRECT_CONSOLE_LOG } from '../../angular-terminal/logger'

// @ts-ignore
globalThis['Node'] = Node

export const platformRectangulrDynamicTesting = createPlatformFactory(
  platformCore,
  'rectangulrDynamicTesting',
  [
    ...INTERNAL_RECTANGULR_PLATFORM_PROVIDERS,
    { provide: REDIRECT_CONSOLE_LOG, useValue: false },
    {
      provide: COMPILER_OPTIONS,
      useValue: {
        // providers: [
        //   { provide: ElementSchemaRegistry, useClass: TerminalElementSchemaRegistry }, // Only used in JIT mode
        // ],
      },
      multi: true,
    },
  ]
)
