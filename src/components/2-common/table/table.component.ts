import { Component, ContentChild, Input, Output, TemplateRef, ViewChild } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import * as json5 from 'json5'
import _, { values } from 'lodash'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { map } from 'rxjs/operators'
import { makeRuleset } from '../../../angular-terminal/dom-terminal'
import { computed, effect, Signal, signal } from '../../../angular-terminal/signals'
import { Command, registerShortcuts, ShortcutService } from '../../../commands/shortcut.service'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { makeObservable, subscribe } from '../../../utils/reactivity'
import { assert, filterNulls, inputToSignal } from '../../../utils/utils'
import { Box } from '../../1-basics/box'
import { ClassesDirective } from '../../1-basics/classes'
import { List } from '../list/list'
import { ListItem } from '../list/list-item'

@Component({
  standalone: true,
  selector: 'row',
  host: { '[style]': `{ height: 1 }` },
  template: `{{ text() }}`,
})
export class Row<T> {
  @Input() data: T
  text: Signal<string>

  constructor(public table: Table<T>) {}

  ngOnInit() {
    assert(this.data)
    assert(typeof this.data == 'object')
    assert(this.table.$columns)

    this.text = computed(() => {
      const columns = this.table.$columns()
      const selectedColumn = this.table.$selectedColumn()
      const selectedItem = this.table.$selectedItem()

      let line = ''

      columns
        .map(column => {
          let value = this.data[column.id]
          assert(value !== undefined)

          if (typeof value == 'string') {
            value = String(value).slice(0, column.width).padEnd(column.width)
          } else {
            value = json5.stringify(value).slice(0, column.width).padEnd(column.width)
          }
          return { ...column, string: value }
        })
        .forEach(column => {
          if (selectedColumn && column.id == selectedColumn.id && this.data == selectedItem) {
            line += '>' + column.string + '<|'
          } else {
            line += ' ' + column.string + ' |'
          }
        })

      return line
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
    return this.computeColumnWidths(this.$items())
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

    inputToSignal(this, 'items', '$items')

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
      if (selectedColumn && column.id == selectedColumn.id) {
        headers += '>' + column.string + '<|'
      } else {
        headers += ' ' + column.string + ' |'
      }
    })
    return headers
  }

  computeColumnWidths(items: any[]) {
    if (!items || items.length == 0) {
      return []
    }

    const keys = Object.keys(items[0])

    return keys.map(key => {
      const columnWidth = computeWidth(items.slice(0, 20), key)
      const res = { id: key, width: columnWidth }
      return res
    })

    function computeWidth(items: any[], key: string) {
      const valuesWidth = items.map(item => String(item[key]).length)
      const max = _.max(valuesWidth)
      return _.clamp(max, key.length, 50)
    }
  }

  selectColumnIndex(value) {
    if (!this.$columns() || this.$columns().length == 0) {
      this.$selectedColumnIndex.set(null)
      return
    }

    this.$selectedColumnIndex.set(_.clamp(value, 0, this.$columns().length - 1))
  }

  shortcuts: Partial<Command>[] = [
    {
      keys: 'ctrl+shift+l',
      id: 'resizeColumns',
      func: () => {
        this.computeColumnWidths(this.$items())
      },
    },
    {
      keys: 'left',
      func: () => {
        this.selectColumnIndex(this.$selectedColumnIndex() - 1)
      },
    },
    {
      keys: 'right',
      func: () => {
        this.selectColumnIndex(this.$selectedColumnIndex() + 1)
      },
    },
    {
      keys: 'home',
      func: () => {
        this.selectColumnIndex(0)
      },
    },
    {
      keys: 'end',
      func: () => {
        this.selectColumnIndex(this.$columns().length - 1)
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
