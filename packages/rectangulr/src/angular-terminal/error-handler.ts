import { ErrorHandler, Injectable, inject } from '@angular/core'
import { LOGGER } from './logger'
import { ScreenService } from './screen-service'

@Injectable()
export class RectangulrErrorHandler implements ErrorHandler {
  // screen = inject(ScreenService)
  logger = inject(LOGGER)


  handleError(error: Error): void {
    // Log
    this.logger.log(error)
    if (JSON.stringify(error) == '{"level":"error")') {
      debugger
    }

    // Release terminal and exit
    // this.screen.termScreen.releaseScreen()
    ; (globalThis as any).original_console.log(error)
    process.exit(1)
  }
}
