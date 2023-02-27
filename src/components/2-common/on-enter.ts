import { Directive, EventEmitter, Inject, Optional, Output, Self } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Subject } from 'rxjs'
import { Command, registerShortcuts, ShortcutService } from '../../commands/shortcut.service'
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
        if (this.valueAccessor && this.currentValue == undefined) return key

        this.onEnter.emit(this.currentValue)
      },
    },
  ]

  constructor(
    @Optional() @Self() @Inject(NG_VALUE_ACCESSOR) public valueAccessor: ControlValueAccessor,
    public shortcutService: ShortcutService
  ) {
    if (valueAccessor) {
      valueAccessor.registerOnChange(value => {
        this.currentValue = value
      })
    }

    registerShortcuts(this, this.shortcuts)
  }

  ngOnInit() {
    this.shortcutService.requestFocus()
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
