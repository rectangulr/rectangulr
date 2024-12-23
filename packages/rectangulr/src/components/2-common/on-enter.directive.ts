import { Directive, EventEmitter, Output, inject } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Subject } from 'rxjs'
import { Command, ShortcutService, registerShortcuts } from '../../commands/shortcut.service'

@Directive({
  standalone: true,
  selector: '[onEnter]',
})
export class OnEnterDirective {
  valueAccessors = inject(NG_VALUE_ACCESSOR, { optional: true })
  shortcutService = inject(ShortcutService)

  @Output() onEnter = new EventEmitter()

  currentValue = undefined

  constructor() {
    if (this.valueAccessors) {
      this.valueAccessors.forEach(accessor => {
        accessor.registerOnChange(value => {
          this.currentValue = value
        })
      })
    }

    registerShortcuts(this.shortcuts)
  }

  shortcuts: Partial<Command>[] = [
    {
      keys: 'enter',
      func: key => {
        if (this.valueAccessors && this.currentValue == undefined) return key

        this.onEnter.emit(this.currentValue)
      },
    },
  ]

  ngOnInit() {
    this.shortcutService.requestFocus({ reason: 'OnEnterDirective onInit' })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
