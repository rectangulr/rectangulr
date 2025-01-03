import { Component, computed, forwardRef, inject, input } from '@angular/core'
import * as json5 from 'json5'
import { mapKeyValue, stringifyReplacer } from '../../../utils/utils'
import { GrowDirective, HBox } from '../../1-basics/box'
import { StyleDirective } from '../../1-basics/style'
import { List } from './list'

@Component({
  selector: 'basic-object-display',
  template: `<h [s]="{ height: 1 }">{{ text }}</h>`,
  standalone: true,
  imports: [HBox, StyleDirective],
})
export class BasicObjectDisplay {
  readonly data = input<any>(undefined);
  readonly includeKeysInput = input<string[]>(undefined, { alias: 'includeKeys' })
  includeKeys = computed(() => {
    return this.includeKeysInput() || Object.keys(this.data() ?? {})
  })
  readonly excludeKeys = input<string[]>([])
  text = 'error'

  list = inject(forwardRef(() => List))

  ngOnInit() {
    const typeOf = typeof this.data()
    const data = this.data()
    if (data == null) {
      this.text = 'null'
    } else if (typeOf == 'string' || typeOf == 'number') {
      this.text = data
    } else if (typeOf == 'object') {
      if (data.name != undefined) {
        this.text = data.name
      } else {
        const newObject = mapKeyValue(data, (key, value) => {
          if (this.includeKeys().includes(key)) {
            if (!this.excludeKeys().includes(key)) {
              // json can't contain bigint
              if (typeof value == 'bigint') {
                value = Number(value)
              }
              return [key, value]
            }
          }
        })
        this.text = json5.stringify(newObject, stringifyReplacer())
      }
    } else {
      throw new Error(`can't display this`)
    }
  }
}
