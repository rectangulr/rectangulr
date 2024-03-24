import { DestroyRef, Directive, Injector, Input, Self, inject, runInInjectionContext } from '@angular/core'
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
  debugDenied = false

  injector = inject(Injector)
  shortcutService = inject(ShortcutService, { self: true })
  destroyRef = inject(DestroyRef)
  onDestroy = f => this.destroyRef.onDestroy(f)

  constructor() {
  }

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

    registerShortcuts(this.focusShortcuts, { shortcutService: this.shortcutService, onDestroy: this.onDestroy })
    if (this.focusFull) {
      registerShortcuts(this.focusFullShortcuts, { shortcutService: this.shortcutService, onDestroy: this.onDestroy })
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
    this.shortcutService.debugDenied = true
  }
}
