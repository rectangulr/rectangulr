import { ApplicationInitStatus, COMPILER_OPTIONS, NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { TestComponentRenderer } from '@angular/core/testing'
import { TERMINAL } from '../../angular-terminal/terminals/terminal'
import { VoidTerminal } from '../../angular-terminal/terminals/void'
import { RECTANGULR_MODULE_PROVIDERS } from '../../rectangulr-module-providers'

class EmptyTestComponentRenderer implements TestComponentRenderer {
  insertRootElement(rootElementId: string): void { }
  removeAllRootElements?(): void { }
}

export const RECTANGULR_TEST_PROVIDERS = [
  ...RECTANGULR_MODULE_PROVIDERS,
  { provide: COMPILER_OPTIONS, useValue: [], multi: true },
  { provide: TestComponentRenderer, useClass: EmptyTestComponentRenderer },
  { provide: ApplicationInitStatus },
  { provide: TERMINAL, useValue: VoidTerminal },
]

@NgModule({
  providers: RECTANGULR_TEST_PROVIDERS,
  schemas: [NO_ERRORS_SCHEMA],
})
export class RectangulrDynamicTestingModule { }
