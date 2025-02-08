import { Injectable, inject } from '@angular/core'
import { TermScreen } from './dom-terminal'
import { LOGGER } from './logger'
import { TERMINAL } from './terminals/Terminal'

/**
 * The bridge between Angular and @manaflair/mylittledom
 */
@Injectable({
  providedIn: 'root',
})
export class ScreenService {
  terminal = inject(TERMINAL)
  termScreen = inject(TermScreen)
  logger = inject(LOGGER)

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
