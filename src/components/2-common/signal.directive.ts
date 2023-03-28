import { Directive, Inject, Input } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Subject } from 'rxjs'
import { signal } from '../../angular-terminal/signals'
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

  constructor(@Inject(NG_VALUE_ACCESSOR) public valueAccessors: ControlValueAccessor[]) {
    assert(valueAccessors)
    valueAccessors.forEach(accessor => {
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
