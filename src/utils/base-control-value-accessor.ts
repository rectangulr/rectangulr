import { ControlValueAccessor } from '@angular/forms'

/**
 * An interface that a component can implement to share its internal 'value'.
 * Example: A text-input can share its text.
 * Example: A list can share the currently selected line.
 * This BaseControlValueAccessor gives a good starting point
 * to implement the ControlValueAccessor interface for a component.
 */
export class BaseControlValueAccessor implements ControlValueAccessor {
  value = undefined
  onChangeHandlers = []
  onTouchHandlers = []
  disabled = false
  emitOnWrite = true

  writeValue(value: any): void {
    this.value = value
    if (this.emitOnWrite == true) {
      this.emitChange(value)
    }
  }

  registerOnChange(fn: any): void {
    this.onChangeHandlers.push(fn)
  }

  registerOnTouched(fn: any): void {
    this.onTouchHandlers.push(fn)
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled
  }

  emitChange(value) {
    this.onChangeHandlers.forEach(handler => handler(value))
  }
}
