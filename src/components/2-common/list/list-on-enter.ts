import { Directive, EventEmitter, Inject, Output } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Subject } from 'rxjs'
import { Command } from '../../../commands/shortcut.service'
import { assert } from '../../../utils/utils'

@Directive({
  standalone: true,
  selector: '[onEnter]',
})
export class OnEnterDirective {
  @Output() onEnter = new EventEmitter()

  currentValue = null

  shortcuts: Partial<Command>[] = [
    {
      keys: 'enter',
      id: 'onEnter',
      func: key => {
        if (this.currentValue == undefined) return key

        this.onEnter.emit(this.currentValue)
      },
    },
  ]

  constructor(@Inject(NG_VALUE_ACCESSOR) valueAccessor: ControlValueAccessor) {
    assert(valueAccessor)

    valueAccessor.registerOnChange(value => {
      this.currentValue = value
    })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
