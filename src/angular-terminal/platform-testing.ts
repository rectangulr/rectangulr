import { DOCUMENT } from '@angular/common'
import { ElementSchemaRegistry } from '@angular/compiler'
import {
  APP_ID,
  COMPILER_OPTIONS,
  createPlatformFactory,
  ErrorHandler,
  NgModule,
  NgZone,
  RendererFactory2,
  Sanitizer,
} from '@angular/core'
import { TestComponentRenderer } from '@angular/core/testing'
import { platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing'
import { RectangulrModule } from '../rectangulr.module'
import { RectangulrRendererFactory } from './angular-dom'
import { RectangulrErrorHandler } from './error-handler'
import { INPUT_OUTPUT, StdinStdout } from './input-output'
import { TerminalSanitizer } from './sanitizer'
import { TerminalElementSchemaRegistry } from './schema-registry'
import { ScreenService } from './screen-service'

export const platformRectangulrDynamicTesting = createPlatformFactory(
  platformBrowserDynamicTesting,
  'rectangulrDynamicTesting',
  [
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
  ]
)

class EmptyTestComponentRenderer implements TestComponentRenderer {
  insertRootElement(rootElementId: string): void {}
  removeAllRootElements?(): void {}
}

@NgModule({
  imports: [RectangulrModule],
  exports: [RectangulrModule],
  providers: [
    { provide: 'global', useValue: globalThis },
    { provide: DOCUMENT, useValue: {} },
    { provide: Sanitizer, useClass: TerminalSanitizer, deps: [] },
    { provide: COMPILER_OPTIONS, useValue: [], multi: true },
    { provide: ScreenService, useClass: ScreenService },
    { provide: RendererFactory2, useClass: RectangulrRendererFactory },
    { provide: ErrorHandler, useClass: RectangulrErrorHandler },
    { provide: APP_ID, useValue: 'a' },
    { provide: TestComponentRenderer, useClass: EmptyTestComponentRenderer },
    {
      provide: NgZone,
      useFactory: () => {
        return new NgZone({ enableLongStackTrace: true, shouldCoalesceEventChangeDetection: false })
      },
    },
    // { provide: INPUT_OUTPUT, useValue: VoidInputOuput },
    { provide: INPUT_OUTPUT, useValue: StdinStdout },
  ],
})
export class RectangulrTestingModule {}
