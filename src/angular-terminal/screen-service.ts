import { Inject, Injectable, Injector, NgZone } from '@angular/core'
import { TermScreen } from './dom-terminal'
import { INPUT_OUTPUT, InputOutput } from './input-output'
import { Logger } from './logger'

@Injectable({
  providedIn: 'root',
})
export class ScreenService {
  public termScreen: TermScreen

  constructor(
    @Inject(INPUT_OUTPUT) public inputOutput: InputOutput,
    public ngZone: NgZone,
    public logger: Logger,
    public injector: Injector,
  ) {
    this.termScreen = new TermScreen(false, this.logger, injector)

    {
      // Patch the `inputOutput.output.write` function, so that writing doesn't trigger
      // another change detection, which would create an infinite loop.
      const original_func = inputOutput.output.write
      inputOutput.output.write = (...args) => {
        return this.ngZone.runOutsideAngular(() => {
          return original_func.apply(process.stdout, args)
        })
      }
    }

    this.attachScreen()

    globalThis['DOM'] = this.termScreen
  }

  attachScreen() {
    this.termScreen.attachScreen({
      stdin: this.inputOutput.input,
      stdout: this.inputOutput.output,
      trackOutputSize: true,
      throttleMouseMoveEvents: 1000 / 60,
    })
  }

  releaseScreen() {
    this.termScreen.releaseScreen()
  }

  selectRootElement(): TermScreen {
    return this.termScreen
  }

  clearScreen() {
    this.termScreen.clearScreen()
  }
}
