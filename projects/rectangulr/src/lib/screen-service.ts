import { Injectable, NgZone } from '@angular/core'
import { TermElement, TermScreen } from '../mylittledom'
import { elementsFactory } from './elements-registry'

@Injectable({ providedIn: 'root' })
export class Screen {
  public screen: TermScreen

  constructor(public ngZone: NgZone) {
    this.screen = new TermScreen({ debugPaintRects: false })
    {
      // Patch the stdout object, so that writing to it doesn't trigger another change detection.
      // Because that would create an infinite loop.
      const original_func = process.stdout.write
      process.stdout.write = (...args) => {
        return this.ngZone.runOutsideAngular(() => {
          return original_func.apply(process.stdout, args)
        })
      }
    }
    this.screen.attachScreen({
      stdin: process.stdin,
      stdout: process.stdout,
      trackOutputSize: true,
      throttleMouseMoveEvents: 1000 / 60,
    })
    globalThis['DOM'] = this.screen
  }

  createElement(name: string, options: any = {}): TermElement {
    let elementFactory = elementsFactory.get(name)

    if (!elementFactory) {
      elementFactory = elementsFactory.get('box')
    }

    return new elementFactory(options)
  }

  selectRootElement(): TermScreen {
    return this.screen
  }
}
