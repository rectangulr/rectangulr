import { Inject, Injectable, NgZone } from '@angular/core'
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
    public logger: Logger
  ) {
    this.termScreen = new TermScreen({ debugPaintRects: false, logger: this.logger })

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

    this.termScreen.attachScreen({
      stdin: inputOutput.input,
      stdout: inputOutput.output,
      trackOutputSize: true,
      throttleMouseMoveEvents: 1000 / 60,
    })

    globalThis['DOM'] = this.termScreen
  }

  selectRootElement(): TermScreen {
    return this.termScreen
  }
}
