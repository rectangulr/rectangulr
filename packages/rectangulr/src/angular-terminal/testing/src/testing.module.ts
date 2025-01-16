import { ApplicationInitStatus, COMPILER_OPTIONS, NgModule } from '@angular/core'
import { TestComponentRenderer } from '@angular/core/testing'
import { RECTANGULR_MODULE_PROVIDERS } from '../../../rectangulr-module-providers'
import { TERMINAL } from '../../terminals/terminal'
import { voidTerminal } from '../../terminals/void'

class EmptyTestComponentRenderer implements TestComponentRenderer {
  insertRootElement(rootElementId: string): void { }
  removeAllRootElements?(): void { }
}

@NgModule({
  providers: [
    ...RECTANGULR_MODULE_PROVIDERS,
    { provide: COMPILER_OPTIONS, useValue: [], multi: true },
    { provide: TestComponentRenderer, useClass: EmptyTestComponentRenderer },
    { provide: ApplicationInitStatus },
    { provide: TERMINAL, useValue: voidTerminal },
  ],
})
export class RectangulrDynamicTestingModule { }
