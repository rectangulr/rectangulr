import { NgComponentOutlet } from '@angular/common'
import { Directive, Host, input } from '@angular/core'
import { assert } from './utils'

@Directive({
  standalone: true,
  selector: '[ngComponentOutlet][inputs]',
})
export class ComponentOutletInputs {
  readonly inputs = input<{ [prop: string]: any } | undefined>(undefined)
  componentRef: any

  constructor(@Host() private componentOutlet: NgComponentOutlet) {
    this.componentRef = (this.componentOutlet as any)._componentRef
    assert(this.componentRef)

    const inputs = this.inputs()
    if (inputs) {
      for (const [key, value] of Object.entries(inputs)) {
      }
    }
  }
}
