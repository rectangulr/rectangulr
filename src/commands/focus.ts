import { Directive, Input } from '@angular/core'
import { onChange } from '../utils/reactivity'
import { ShortcutService } from './shortcut.service'

@Directive({
  selector: '[focusIf]',
})
export class FocusIfDirective {
  constructor(public shortcutService: ShortcutService) {}
}

@Directive({
  selector: '[focus]',
  providers: [ShortcutService],
})
export class FocusDirective {
  @Input() focusPropagateUp = true
  @Input() focusIf = false

  constructor(public shortcutService: ShortcutService) {
    onChange(this, 'focusIf', focusIf => {
      this.shortcutService.focusIf = focusIf
      if (focusIf) {
        this.shortcutService.requestFocus()
      }
    })
  }

  ngOnInit() {
    this.shortcutService.focusIf = this.focusIf
    this.shortcutService.focusPropagateUp = this.focusPropagateUp
    this.shortcutService.requestFocus()
  }
}
