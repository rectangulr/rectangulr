import { Directive, Inject, inject, signal, input } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Subject } from 'rxjs'
import { assert } from '../../utils/Assert'

abstract class ValueProxy { }

@Directive({
  standalone: true,
  selector: '[signal]',
})
export class SignalDirective {
  readonly signal = input(signal(undefined))

  // TODO
  readonly signalProxy = input<ValueProxy>(null);

  currentValue = null
  valueAccessors: readonly ControlValueAccessor[]

  constructor() {
    this.valueAccessors = inject(NG_VALUE_ACCESSOR)
    assert(this.valueAccessors)
    this.valueAccessors.forEach(accessor => {
      accessor.registerOnChange(value => {
        this.currentValue = value
        this.signal().set(value)
      })
    })
  }

  ngOnInit() {
    this.valueAccessors.forEach(accessor => {
      accessor.writeValue(this.signal()())
    })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
