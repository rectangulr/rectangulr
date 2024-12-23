import { Directive, EventEmitter, inject, NgZone, Output } from '@angular/core'
import { LOGGER } from '../angular-terminal/logger'
import { ShortcutService } from './shortcut.service'

@Directive({
  standalone: true,
  selector: '[detachedCommandService]',
  providers: [
    { provide: ShortcutService },
  ],
})
export class DetachedCommandServiceDirective {
  @Output() detachedCommandService = new EventEmitter()

  constructor() {
    const detachedCommandService = inject(ShortcutService)

    this.detachedCommandService.emit(detachedCommandService)
  }
}
