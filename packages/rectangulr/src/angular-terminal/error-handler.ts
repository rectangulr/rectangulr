import { ErrorHandler, Injectable, inject } from '@angular/core'
import { LOGGER } from './logger'
import { ScreenService } from './ScreenService'




/*
  Removed screen.releaseScreen() because it was causing an inject() cycle
    internalProvideZoneChangeDetection
    NgZoneChangeDetectionScheduler
    ChangeDetectionScheduler
    AppRef
    INTERNAL_APPLICATION_ERROR_HANDLER
    ErrorHandler
    RectangulrErrorHandler
    ScreenService
    .attachScreen
    effect()
    ChangeDetectionScheduler
 */

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
    // process.exit(1)
  }
}
