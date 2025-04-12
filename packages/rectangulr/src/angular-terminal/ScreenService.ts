import { Injectable, inject } from '@angular/core'
import { TermScreen } from './dom-terminal'
import { LOGGER } from './logger'

/**
 * The bridge between Angular and @manaflair/mylittledom
 */
@Injectable({
  providedIn: 'root',
})
export class ScreenService {
  termScreen = inject(TermScreen)
  logger = inject(LOGGER)

  constructor() {
    globalThis['DOM'] = this.termScreen
  }

  releaseScreen() {
    this.termScreen.detachTerminal()
  }

  selectRootElement(): TermScreen {
    return this.termScreen
  }

  clearScreen() {
    this.termScreen.clearScreen()
  }
}
