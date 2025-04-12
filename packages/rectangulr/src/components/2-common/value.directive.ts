import { Directive, EventEmitter, Output, inject, input } from '@angular/core'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import { assert } from '../../utils/Assert'

abstract class ValueProxy { }

@Directive({
  standalone: true,
  selector: '[value]',
})
export class ValueDirective {
  valueAccessors = inject(NG_VALUE_ACCESSOR)

  readonly value = input(undefined)
  @Output() valueChange = new EventEmitter(true)

  // TODO
  readonly valueProxy = input<ValueProxy>(null)

  currentValue = null

  constructor() {
    const valueAccessors = this.valueAccessors

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
      accessor.writeValue(this.value())
    })
  }
}
