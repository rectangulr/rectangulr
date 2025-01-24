import { ApplicationInitStatus, COMPILER_OPTIONS, NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { TestComponentRenderer } from '@angular/core/testing'
import { ɵRECTANGULR_MODULE_PROVIDERS, ɵTERMINAL, ɵvoidTerminal } from '@rectangulr/rectangulr'

class EmptyTestComponentRenderer implements TestComponentRenderer {
  insertRootElement(rootElementId: string): void { }
  removeAllRootElements?(): void { }
}

export const RECTANGULR_TEST_PROVIDERS = [
  ...ɵRECTANGULR_MODULE_PROVIDERS,
  { provide: COMPILER_OPTIONS, useValue: [], multi: true },
  { provide: TestComponentRenderer, useClass: EmptyTestComponentRenderer },
  { provide: ApplicationInitStatus },
  { provide: ɵTERMINAL, useValue: ɵvoidTerminal },
]

@NgModule({
  providers: RECTANGULR_TEST_PROVIDERS,
  schemas: [NO_ERRORS_SCHEMA]
})
export class RectangulrDynamicTestingModule { }
