import { ApplicationInitStatus, COMPILER_OPTIONS, NgModule, NO_ERRORS_SCHEMA } from '@angular/core'
import { TestComponentRenderer } from '@angular/core/testing'
import { LOGGER, ɵRECTANGULR_MODULE_PROVIDERS, ɵTERMINAL, ɵVOID_TERMINAL_SIZE, ɵvoidTerminal } from '@rectangulr/rectangulr'


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
  { provide: LOGGER, useValue: console },
  { provide: 'TESTING', useValue: true },
  { provide: ɵVOID_TERMINAL_SIZE, useValue: { width: 10, height: 10 } }
]

@NgModule({
  providers: RECTANGULR_TEST_PROVIDERS,
  schemas: [NO_ERRORS_SCHEMA]
})
export class RectangulrDynamicTestingModule { }
