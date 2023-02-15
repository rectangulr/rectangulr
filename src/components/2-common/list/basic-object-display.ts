import { Component, Input } from '@angular/core'
import * as json5 from 'json5'
import { mapKeyValue, stringifyReplacer } from '../../../utils/utils'
import { Box } from '../../1-basics/box'
import { List } from './list'

@Component({
  standalone: true,
  imports: [Box],
  selector: 'basic-object-display',
  template: `<box [style]="{ height: 1 }">{{ text }}</box>`,
})
export class BasicObjectDisplay {
  @Input() data: any
  @Input() includeKeys: string[]
  @Input() excludeKeys: string[] = []
  text = 'error'

  constructor(public list: List<any>) {}

  ngOnInit() {
    const type = typeof this.data
    if (this.data == null) {
      this.text = 'null'
    } else if (type == 'string' || type == 'number') {
      this.text = this.data
    } else if (type == 'object') {
      this.includeKeys = this.includeKeys || Object.keys(this.data)
      if (this.data.name != undefined) {
        this.text = this.data.name
      } else {
        const newObject = mapKeyValue(this.data, (key, value) => {
          if (this.includeKeys.includes(key)) {
            if (!this.excludeKeys.includes(key)) {
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
