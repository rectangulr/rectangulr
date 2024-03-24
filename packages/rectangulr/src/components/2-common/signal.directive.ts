import { Directive, Inject, Input, inject, signal } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Subject } from 'rxjs'
import { assert } from '../../utils/utils'

abstract class ValueProxy {}

@Directive({
  standalone: true,
  selector: '[signal]',
})
export class SignalDirective {
  @Input() signal = signal(undefined)

  // TODO
  @Input() signalProxy: ValueProxy = null

  currentValue = null
  valueAccessors: readonly ControlValueAccessor[]

  constructor() {
    this.valueAccessors = inject(NG_VALUE_ACCESSOR)
    assert(this.valueAccessors)
    this.valueAccessors.forEach(accessor => {
      accessor.registerOnChange(value => {
        this.currentValue = value
        this.signal.set(value)
      })
    })
  }

  ngOnInit() {
    this.valueAccessors.forEach(accessor => {
      accessor.writeValue(this.signal())
    })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
