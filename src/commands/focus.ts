import { Directive, Input } from '@angular/core'
import { onChange } from '../utils/reactivity'
import { ShortcutService } from './shortcut.service'

@Directive({
  selector: '[focus], [focusIf], [focusPropagateUp]',
  providers: [ShortcutService],
})
export class FocusDirective {
  @Input() focusPropagateUp = true
  @Input() focusIf = false

  constructor(public shortcutService: ShortcutService) {}

  ngOnInit() {
    this.shortcutService.focusIf = this.focusIf
    onChange(this, 'focusIf', focusIf => {
      this.shortcutService.focusIf = focusIf
      if (focusIf) {
        this.shortcutService.requestFocus()
      }
    })

    this.shortcutService.focusPropagateUp = this.focusPropagateUp
    this.shortcutService.requestFocus()
  }
}
