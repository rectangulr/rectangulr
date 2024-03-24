import { NgComponentOutlet } from '@angular/common'
import { Directive, Host, Input } from '@angular/core'
import { assert } from './utils'

@Directive({
  standalone: true,
  selector: '[ngComponentOutlet][inputs]',
})
export class ComponentOutletInputs {
  @Input() inputs: { [prop: string]: any }
  componentRef: any

  constructor(@Host() private componentOutlet: NgComponentOutlet) {
    this.componentRef = (this.componentOutlet as any)._componentRef
    assert(this.componentRef)

    for (const [key, value] of Object.entries(this.inputs)) {
      this.componentRef[key] = value
    }
  }
}
