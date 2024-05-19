import { InjectionToken } from '@angular/core'
import { Input } from '../dom-terminal/sources/term/elements/TermScreen'
import { Disposable } from '../../utils/queue'

export interface TerminalInputs {
  /**
   * Send an input to the terminal.
   * Rectangulr will listen to inputs (keyboard, mouse) being sent here and react accordingly.
   */
  send(input: Input): void
  on(event: string, func: (...args: any[]) => void): any
  /**
   * Get notified on inputs.
   */
  subscribe(func: (input: Input) => void): Disposable
  setRawMode?(yes: boolean): void
}

export interface TerminalScreen {
  /**
   * Write some text to the screen.
   * This can be simple text or ANSI escape sequences.
   */
  write(text: string)

  /**
   * Register a function to be called when the event fires.
   * @example term.on('resize', e => console.log(e))
   */
  on(event: string, func: (...args: any[]) => void): any

  /**
   * The size available in this terminal as (width,height).
   */
  size: () => { width: number, height: number }
}

export interface Terminal {
  inputs: TerminalInputs,
  screen: TerminalScreen
}

export const TERMINAL = new InjectionToken<Terminal>('Terminal')
