import { Directive, Input } from '@angular/core'
import { onChange } from '../utils/reactivity'
import { registerShortcuts, ShortcutService } from './shortcut.service'
import { Subject } from 'rxjs'

@Directive({
  standalone: true,
  selector: '[focus], [focusIf], [focusPropagateUp], [focusShortcuts]',
  providers: [ShortcutService],
})
export class FocusDirective {
  @Input() focusPropagateUp = true
  @Input() focusIf = true
  @Input() focusShortcuts = []

  constructor(public shortcutService: ShortcutService) {}

  ngOnInit() {
    this.shortcutService.focusIf = this.focusIf
    onChange(this, 'focusIf', focusIf => {
      this.shortcutService.focusIf = focusIf
      if (focusIf) {
        this.shortcutService.requestFocus()
      } else {
        this.shortcutService.unfocus()
      }
    })

    registerShortcuts(this, this.focusShortcuts)
    this.shortcutService.focusPropagateUp = this.focusPropagateUp
    this.shortcutService.requestFocus()
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
