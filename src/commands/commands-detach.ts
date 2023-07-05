import { Directive, EventEmitter, inject, NgZone, Output } from '@angular/core'
import { Logger } from '../angular-terminal/logger'
import { ShortcutService } from './shortcut.service'

@Directive({
  standalone: true,
  selector: '[detachedCommandService]',
  providers: [
    {
      provide: ShortcutService,
      useFactory: () => {
        return new ShortcutService(null, inject(Logger), null)
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
