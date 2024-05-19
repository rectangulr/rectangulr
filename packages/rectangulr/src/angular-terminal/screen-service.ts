import { Inject, Injectable, Injector, inject } from '@angular/core'
import { TermScreen } from './dom-terminal'
import { Logger } from './logger'
import { TERMINAL, Terminal } from './terminals/terminal'

/**
 * The bridge between Angular and @manaflair/mylittledom
 */
@Injectable({
  providedIn: 'root',
})
export class ScreenService {
  terminal = inject(TERMINAL)
  logger = inject(Logger)
  termScreen = inject(TermScreen)

  constructor() {
    this.attachScreen()

    globalThis['DOM'] = this.termScreen
  }

  attachScreen() {
    this.termScreen.attachScreen(
      true,
      1000 / 60,
    )
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
