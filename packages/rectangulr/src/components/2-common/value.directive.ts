import { Directive, EventEmitter, Inject, Input, Output } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Subject } from 'rxjs'
import { ShortcutService } from '../../commands/shortcut.service'
import { assert } from '../../utils/utils'

abstract class ValueProxy { }

@Directive({
  standalone: true,
  selector: '[value]',
})
export class ValueDirective {
  @Input() value = undefined
  @Output() valueChange = new EventEmitter(true)

  // TODO
  @Input() valueProxy: ValueProxy = null

  currentValue = null

  constructor(@Inject(NG_VALUE_ACCESSOR) public valueAccessors: ControlValueAccessor[]) {
    assert(valueAccessors)
    valueAccessors.forEach(accessor => {
      accessor.registerOnChange(value => {
        this.currentValue = value
        this.valueChange.emit(value)
      })
    })
  }

  ngOnInit() {
    this.valueAccessors.forEach(accessor => {
      accessor.writeValue(this.value)
    })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
