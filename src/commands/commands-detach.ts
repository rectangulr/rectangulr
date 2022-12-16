import { Directive, EventEmitter, inject, Output } from '@angular/core'
import { Logger } from '../angular-terminal/logger'
import { ShortcutService } from './shortcut.service'

@Directive({
  selector: '[detachedCommandService]',
  providers: [
    {
      provide: ShortcutService,
      useFactory: () => {
        const logger = inject(Logger)
        const shortcutService = new ShortcutService(null, logger, null)
        return shortcutService
      },
    },
  ],
})
export class DetachedCommandServiceDirective {
  @Output() detachedCommandService = new EventEmitter()

  constructor(detachedCommandService: ShortcutService) {
    this.detachedCommandService.emit(detachedCommandService)
  }
}
