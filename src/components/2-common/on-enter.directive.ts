import { Directive, EventEmitter, Inject, Output, inject } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Subject } from 'rxjs'
import { Command, ShortcutService, registerShortcuts } from '../../commands/shortcut.service'
import { assert } from '../../utils/utils'

@Directive({
  standalone: true,
  selector: '[onEnter]',
})
export class OnEnterDirective {
  @Output() onEnter = new EventEmitter()

  currentValue = undefined

  shortcuts: Partial<Command>[] = [
    {
      keys: 'enter',
      func: key => {
        if (this.valueAccessors && this.currentValue == undefined) return key

        this.onEnter.emit(this.currentValue)
      },
    },
  ]

  constructor(
    @Inject(NG_VALUE_ACCESSOR) public valueAccessors: ControlValueAccessor[],
    public shortcutService: ShortcutService
  ) {
    assert(this.valueAccessors)
    this.valueAccessors.forEach(accessor => {
      accessor.registerOnChange(value => {
        this.currentValue = value
      })
    })

    registerShortcuts(this, this.shortcuts)
  }

  ngOnInit() {
    this.shortcutService.requestFocus({ reason: 'OnEnterDirective onInit' })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
