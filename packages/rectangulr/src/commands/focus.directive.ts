import { Component, DestroyRef, Directive, inject, Injector, input } from '@angular/core'
import { Subject } from 'rxjs'
import { onChange } from '../utils/reactivity'
import { registerShortcuts, ShortcutService } from './shortcut.service'
import { patchInputSignal } from '../utils/Signal2'
import { initial } from 'lodash'

@Directive({
  standalone: true,
  selector: '[focus], [focusIf], [focusPropagateUp], [focusShortcuts], [focusFull], [focusOnInit], [focusName]',
  providers: [ShortcutService],
  exportAs: 'focus',
})
export class FocusDirective {
  focusPropagateUp = input(true)
  focusIf = input(true)
  focusShortcuts = input([])
  focusFull = input(false)
  focusOnInit = input(true)
  focusName = input(null)

  injector = inject(Injector)
  shortcutService = inject(ShortcutService, { self: true })
  destroyRef = inject(DestroyRef)
  onDestroy = f => this.destroyRef.onDestroy(f)

  ngOnInit() {
    this.shortcutService.name = this.focusName()
    this.shortcutService.focusIf.$ = this.focusIf()
    // onChange(this, 'focusIf',)
    const focusIf = patchInputSignal(this.focusIf)
    focusIf.subscribe(focusIf => {
      this.shortcutService.focusIf.$ = focusIf
      if (focusIf) {
        this.shortcutService.requestFocus({ reason: 'FocusDirective focusIf true' })
      } else {
        this.shortcutService.unfocus()
      }
    }, { initial: false })

    registerShortcuts(this.focusShortcuts(), { shortcutService: this.shortcutService, onDestroy: this.onDestroy })
    if (this.focusFull()) {
      registerShortcuts(this.focusFullShortcuts, { shortcutService: this.shortcutService, onDestroy: this.onDestroy })
    }
    this.shortcutService.focusPropagateUp.$ = this.focusPropagateUp()
    if (this.focusOnInit()) {
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
