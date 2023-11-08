import { ApplicationInitStatus, COMPILER_OPTIONS, NgModule } from '@angular/core'
import { TestComponentRenderer } from '@angular/core/testing'
import { RECTANGULR_MODULE_PROVIDERS } from '../../rectangulr-module-providers'
import { INPUT_OUTPUT, VoidInputOuput } from '../input-output'

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
    { provide: INPUT_OUTPUT, useValue: VoidInputOuput },
  ],
})
export class RectangulrDynamicTestingModule { }
