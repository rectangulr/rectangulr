import { ErrorHandler, Injectable } from '@angular/core'
import { Logger } from './logger'
import { ScreenService } from './screen-service'

@Injectable()
export class RectangulrErrorHandler implements ErrorHandler {
  constructor(public screen: ScreenService, public logger: Logger) {}

  handleError(error: Error): void {
    // Log
    this.logger.log(error)

    // Release terminal and exit
    this.screen.termScreen.releaseScreen()
    ;(globalThis as any).original_console.log(error)
    process.exit(1)
  }
}
