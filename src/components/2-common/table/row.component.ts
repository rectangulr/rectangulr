import { Component, Input } from '@angular/core'
import { assert } from '../../../utils/utils'
import { Table } from './table.component'

@Component({
  selector: 'row',
  host: { '[style]': '{ height: 1 }' },
  template: ` {{ text }}`,
})
export class Row<T> {
  @Input() data: T
  text: string

  constructor(public table: Table<T>) {}

  ngOnInit() {
    assert(this.data)
    assert(typeof this.data == 'object')
    assert(this.table.columns)

    this.text = this.table.columns
      .map(column => {
        const value = this.data[column.name]
        return String(value).slice(0, column.width).padEnd(column.width)
      })
      .join(' | ')
  }
}
