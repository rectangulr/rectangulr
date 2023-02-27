import { Directive, EventEmitter, Inject, Input, Output } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Subject } from 'rxjs'
import { ShortcutService } from '../../commands/shortcut.service'
import { assert } from '../../utils/utils'

abstract class ValueProxy {}

@Directive({
  standalone: true,
  selector: '[valueAccessor]',
})
export class ValueDirective {
  @Input() valueAccessor = undefined
  @Output() valueAccessorChange = new EventEmitter()

  // TODO
  @Input() valueProxy: ValueProxy = null

  currentValue = null

  constructor(
    @Inject(NG_VALUE_ACCESSOR) valueAccessor: ControlValueAccessor,
    public shortcutService: ShortcutService
  ) {
    assert(valueAccessor)
    valueAccessor.registerOnChange(value => {
      this.currentValue = value
      this.valueAccessorChange.emit(value)
    })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
