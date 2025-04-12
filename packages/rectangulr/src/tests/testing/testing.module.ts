import { ApplicationInitStatus, COMPILER_OPTIONS, NgModule, NO_ERRORS_SCHEMA, Renderer2, RendererFactory2, RendererType2 } from '@angular/core'
import { TestComponentRenderer } from '@angular/core/testing'
import { LOGGER } from '../../angular-terminal/logger'
import { TERMINAL } from '../../angular-terminal/terminals/Terminal'
import { VOID_TERMINAL_SIZE, VoidTerminal } from '../../angular-terminal/terminals/VoidTerminal'
import { RECTANGULR_MODULE_PROVIDERS } from '../../rectangulr-module-providers'

class EmptyTestComponentRenderer implements TestComponentRenderer {
  insertRootElement(rootElementId: string): void { }
  removeAllRootElements?(): void { }
}

class VoidRendererFactory2 implements RendererFactory2 {
  createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
    debugger
    return null
  }
  begin(): void {
    debugger
  }
  end(): void {
    debugger
  }
  whenRenderingDone?(): Promise<any> {
    debugger
    return new Promise(() => { })
  }
}

export const RECTANGULR_TEST_PROVIDERS = [
  ...RECTANGULR_MODULE_PROVIDERS,
  { provide: COMPILER_OPTIONS, useValue: [], multi: true },
  { provide: TestComponentRenderer, useClass: EmptyTestComponentRenderer },
  { provide: ApplicationInitStatus },
  { provide: TERMINAL, useValue: VoidTerminal },
  { provide: LOGGER, useValue: console },
  { provide: 'TESTING', useValue: true },
  { provide: VOID_TERMINAL_SIZE, useValue: { width: 10, height: 10 } }
]

@NgModule({
  providers: RECTANGULR_TEST_PROVIDERS,
  schemas: [NO_ERRORS_SCHEMA],
})
export class RectangulrDynamicTestingModule { }
