import { Component, ContentChild, Input, Output, TemplateRef, ViewChild } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import * as json5 from 'json5'
import _ from 'lodash'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { map } from 'rxjs/operators'
import { makeRuleset } from '../../../angular-terminal/dom-terminal'
import { computed, effect, Signal, signal } from '../../../angular-terminal/signals'
import { Command, registerShortcuts, ShortcutService } from '../../../commands/shortcut.service'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { makeObservable, subscribe } from '../../../utils/reactivity'
import { assert, filterNulls, inputSignal } from '../../../utils/utils'
import { Box } from '../../1-basics/box'
import { ClassesDirective } from '../../1-basics/classes'
import { List } from '../list/list'
import { ListItem } from '../list/list-item'

@Component({
  standalone: true,
  selector: 'row',
  host: { '[style]': '{ height: 1 }' },
  template: `{{ text }}`,
})
export class Row<T> {
  @Input() data: T
  text: string

  constructor(public table: Table<T>) {}

  ngOnInit() {
    assert(this.data)
    assert(typeof this.data == 'object')
    assert(this.table.$columns)

    effect(() => {
      this.text = ''
      const columns = this.table.$columns()
      const selectedColumn = this.table.$selectedColumn()
      const selectedItem = this.table.$selectedItem()

      columns
        .map(column => {
          let value = this.data[column.id]
          if (typeof value == 'string') {
            value = String(value).slice(0, column.width).padEnd(column.width)
          } else {
            value = json5.stringify(value).slice(0, column.width).padEnd(column.width)
          }
          return { ...column, string: value }
        })
        .forEach(column => {
          if (column.id == selectedColumn.id && this.data == selectedItem) {
            this.text += '>' + column.string + '<|'
          } else {
            this.text += ' ' + column.string + ' |'
          }
        })
    })
  }
}

interface Column {
  id: string
  width: number
}

@Component({
  standalone: true,
  imports: [Box, List, Row, ListItem, ClassesDirective],
  selector: 'table',
  template: `
    <box [style]="{ maxHeight: 1 }" [classes]="[s.header]">{{ $headers() }}</box>
    <list
      [items]="items"
      [trackByFn]="trackByFn"
      [template]="template || template2 || defaultTemplate"
      (selectedItem)="$selectedItem.set($event)"
      (visibleItems)="$visibleItems.set($event)">
      <ng-template #defaultTemplate>
        <row *item="let item" [data]="item"></row>
      </ng-template>
    </list>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useFactory: (table: Table<any>) => table.controlValueAccessor,
      deps: [Table],
    },
  ],
})
export class Table<T> {
  @Input() items: T[] | Observable<T[]> | Signal<T[]>
  @Input() template: TemplateRef<any>
  @Input() trackByFn = (index, item) => item
  @Input() includeKeys: string[] = []
  @Input() excludeKeys: string[] = []
  @ContentChild(ListItem, { read: TemplateRef }) template2: TemplateRef<any>
  @Output('selectedItem') $$selectedItem = new BehaviorSubject<T>(null)
  @Output('visibleItems') $$visibleItems = new BehaviorSubject<T[]>(null)

  $items = signal([])
  $columns = computed(() => {
    const res = this.computeColumnWidths(this.$items(), this.prevColumns)
    this.prevColumns = res
    return res
  })
  $headers = computed(() => {
    return this.computedHeaders(this.$columns(), this.$selectedColumn())
  })

  $selectedColumnIndex = signal(0)
  $selectedColumn = computed(() => this.$columns()[this.$selectedColumnIndex()])
  $selectedItem = signal(null)

  @ViewChild(List) list: List<T>
  $list = new BehaviorSubject<List<T>>(null)
  controlValueAccessor: ControlValueAccessor = null
  prevColumns: { id: string; width: number }[]
  $visibleItems = signal([])

  constructor(public shortcutService: ShortcutService) {
    makeObservable(this, 'list', '$list')

    inputSignal(this, 'items', '$items')

    effect(() => {
      this.$$visibleItems.next(this.$visibleItems())
    })

    effect(() => {
      this.$$selectedItem.next(this.$selectedItem())
    })

    registerShortcuts(this, this.shortcuts)

    this.controlValueAccessor = new BaseControlValueAccessor()
    subscribe(
      this,
      this.$list.pipe(
        filterNulls,
        map(list => list.controlValueAccessor)
      ),
      newControlValueAccessor => {
        newControlValueAccessor.value
        newControlValueAccessor.onChangeHandlers.forEach(handler =>
          newControlValueAccessor.registerOnChange(handler)
        )
        newControlValueAccessor.onTouchHandlers.forEach(handler =>
          newControlValueAccessor.registerOnTouched(handler)
        )
        newControlValueAccessor.setDisabledState(newControlValueAccessor.disabled)
      }
    )
  }

  computedHeaders(columns: Column[], selectedColumn: Column) {
    let headers = ''
    _.map(columns, column => {
      let value = column.id.slice(0, column.width).padEnd(column.width)
      return { ...column, string: value }
    }).forEach(column => {
      if (column.id == selectedColumn.id) {
        headers += '>' + column.string + '<|'
      } else {
        headers += ' ' + column.string + ' |'
      }
    })
    return headers
  }

  computeColumnWidths(items, columns: Column[]) {
    if (!items || items.length == 0) {
      return []
    }

    const keys = Object.keys(items[0])
    const keysChanged = !_.isEqual(
      keys,
      columns.map(c => c.id)
    )
    const shouldUpdateWidths = !columns || keysChanged

    return keys.map(key => {
      if (shouldUpdateWidths) {
        var columnWidth = computeWidth(items, key)
      } else {
        // @ts-ignore
        var columnWidth = columns.find(c => c.id == key).width
      }
      const res = { id: key, width: columnWidth }
      return res
    })

    function computeWidth(items: [], key: string) {
      const valuesWidth = items.map(item => String(item[key]).length)
      const averageWidth = _.sum(valuesWidth) / items.length
      const headerWidth = _.clamp(key.length, 2, 15)
      const columnWidth = _.clamp(averageWidth, headerWidth, 40)
      return columnWidth
    }
  }

  shortcuts: Partial<Command>[] = [
    {
      keys: 'ctrl+shift+l',
      id: 'resizeColumns',
      func: () => {
        this.computeColumnWidths(this.$items(), this.$columns())
      },
    },
    {
      keys: 'left',
      func: () => {
        this.$selectedColumnIndex.update(index => {
          return _.clamp(--index, 0, this.$columns().length - 1)
        })
      },
    },
    {
      keys: 'right',
      func: () => {
        this.$selectedColumnIndex.update(index => {
          return _.clamp(++index, 0, this.$columns().length - 1)
        })
      },
    },
    {
      keys: 'home',
      func: () => {
        this.$selectedColumnIndex.set(0)
      },
    },
    {
      keys: 'end',
      func: () => {
        this.$selectedColumnIndex.set(this.$columns().length - 1)
      },
    },
  ]

  s = {
    header: makeRuleset({ backgroundColor: 'gray', color: 'white' }),
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
