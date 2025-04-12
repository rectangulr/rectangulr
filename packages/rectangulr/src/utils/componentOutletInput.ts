import { NgComponentOutlet } from '@angular/common'
import { Directive, input, inject } from '@angular/core'
import { assert } from './Assert'

@Directive({
  standalone: true,
  selector: '[ngComponentOutlet][inputs]',
})
export class ComponentOutletInputs {
  private componentOutlet = inject(NgComponentOutlet, { host: true })

  readonly inputs = input<{ [prop: string]: any } | undefined>(undefined)
  componentRef: any

  constructor() {
    this.componentRef = (this.componentOutlet as any)._componentRef
    assert(this.componentRef)

    const inputs = this.inputs()
    if (inputs) {
      for (const [key, value] of Object.entries(inputs)) {
      }
    }
  }
}
