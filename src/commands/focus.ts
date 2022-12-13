import { Directive, Input } from '@angular/core'
import { onChange } from '../utils/reactivity'
import { ShortcutService } from './shortcut.service'

@Directive({
  selector: '[focusIf]',
})
export class FocusIfDirective {
  @Input() focusIf = false

  constructor(public shortcutService: ShortcutService) {
    onChange(this, 'focusIf', condition => {
      if (condition) {
        this.shortcutService.focus()
      }
    })
  }
}

@Directive({
  selector: '[focus]',
  providers: [ShortcutService],
})
export class FocusDirective {
  constructor(public shortcutService: ShortcutService) {
    this.shortcutService.focus()
  }
}

@Directive({
  selector: '[focusFromChildren]',
})
export class FocusFromChildrenDirective {
  @Input() focusFromChildren = false

  constructor(public shortcutService: ShortcutService) {
    this.shortcutService.focusFromChildren = this.focusFromChildren
  }
}
