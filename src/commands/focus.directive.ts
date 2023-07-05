import { Directive, Input, Self } from '@angular/core'
import { onChange } from '../utils/reactivity'
import { registerShortcuts, ShortcutService } from './shortcut.service'
import { Subject } from 'rxjs'

@Directive({
  standalone: true,
  selector: '[focus], [focusIf], [focusPropagateUp], [focusShortcuts], [focusFull], [focusOnInit], [focusName]',
  providers: [ShortcutService],
  exportAs: 'focus',
})
export class FocusDirective {
  @Input() focusPropagateUp = true
  @Input() focusIf = true
  @Input() focusShortcuts = []
  @Input() focusFull = false
  @Input() focusOnInit = true
  @Input() focusName = null

  constructor(@Self() public shortcutService: ShortcutService) { }

  ngOnInit() {
    this.shortcutService.name = this.focusName
    this.shortcutService.focusIf = this.focusIf
    onChange(this, 'focusIf', focusIf => {
      this.shortcutService.focusIf = focusIf
      if (focusIf) {
        this.shortcutService.requestFocus({ reason: 'FocusDirective focusIf true' })
      } else {
        this.shortcutService.unfocus()
      }
    })

    registerShortcuts(this, this.focusShortcuts)
    if (this.focusFull) {
      registerShortcuts(this, this.focusFullShortcuts)
    }
    this.shortcutService.focusPropagateUp = this.focusPropagateUp
    if (this.focusOnInit) {
      this.shortcutService.requestFocus({ reason: 'FocusDirective onInit' })
    }
  }

  focusFullShortcuts = [
    {
      keys: 'else',
      func: () => { },
    },
  ]

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}

@Directive({
  standalone: true,
  selector: '[focusDebug]',
})
export class FocusDebugDirective {
  constructor(public shortcutService: ShortcutService) {
    debugger
    const original = this.shortcutService.requestFocus
    Object.defineProperty(this.shortcutService, 'requestFocus', {
      get: () => {
        debugger
        return original
      },
    })
    this.shortcutService.requestFocus({ reason: 'focusDebugDirective onInit' })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
