import { Component, Input } from '@angular/core'
import { assert, mapKeyValue } from '../../../utils/utils'
import { List } from '../list/list'

@Component({
  selector: 'row',
  template: `<box [style]="{ height: 1 }">{{ text }}</box>`,
})
export class RowComponent {
  @Input() data: any
  @Input() includeKeys: string[]
  @Input() excludeKeys: string[] = []
  text = 'error'

  constructor(public list: List<any>) {
    list.stats
  }

  ngOnInit() {
    assert(this.data)
    assert(typeof this.data == 'object')
    assert(this.list.stats)

    this.includeKeys = this.includeKeys || Object.keys(this.data)
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

    this.text = Object.entries(newObject)
      .map(([key, value]) => {
        const keyStats = this.list.stats[key]
        const averageLength = keyStats.total / keyStats.nb
        return String(value).slice(0, averageLength).padEnd(averageLength, ' ')
      })
      .join('|')
  }
}
