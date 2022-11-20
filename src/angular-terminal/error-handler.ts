import { ErrorHandler, Injectable } from '@angular/core'
import { Logger } from './logger'
import { Screen } from './screen-service'

@Injectable()
export class RectangulrErrorHandler implements ErrorHandler {
  constructor(public screen: Screen, public logger: Logger) {}

  handleError(error: Error): void {
    this.logger.log(error)
    this.screen.screen.releaseScreen()
    ;(globalThis as any).original_console.log(error)
    process.exit(1)
  }
}
