import { Component, ContentChild, Input, Output, TemplateRef, ViewChild } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { style } from '@manaflair/term-strings'
import _ from 'lodash'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { map } from 'rxjs/operators'
import { makeRuleset } from '../../../angular-terminal/dom-terminal'
import { computed, effect, Signal, signal } from '../../../angular-terminal/signals'
import { Command, registerShortcuts, ShortcutService } from '../../../commands/shortcut.service'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { makeObservable, subscribe } from '../../../utils/reactivity'
import { assert, filterNulls } from '../../../utils/utils'
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

  constructor(public table: Table<T>) { }

  ngOnInit() {
    assert(this.data)
    assert(typeof this.data == 'object')
    assert(this.table.$columns)

    effect(() => {
      this.text = ''
      this.table
        .$columns()
        .map(column => {
          let value = this.data[column.id]
          value = String(value).slice(0, column.width).padEnd(column.width)
          return { ...column, string: value }
        })
        .forEach(column => {
          if (column.id == this.table.$selectedColumn().id) {
            this.text += '_' + column.string + '_|'
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
    <box [style]="{ maxHeight: 1 }" [classes]="[s.header]">{{ headers }}</box>
    <list
      [items]="items"
      [trackByFn]="trackByFn"
      [template]="template || template2 || defaultTemplate"
      (selectedItem)="$selectedItem.next($event)"
      (visibleItems)="$visibleItems.next($event)">
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
  @Output('selectedItem') $selectedItem = new BehaviorSubject<T>(null)
  @Output('visibleItems') $visibleItems = new BehaviorSubject<T[]>(null)

  headers: string = ''

  $columns = signal<Column[]>([])
  $selectedColumnIndex = signal(0)
  $selectedColumn = computed(() => this.$columns()[this.$selectedColumnIndex()])

  @ViewChild(List) list: List<T>
  $list = new BehaviorSubject<List<T>>(null)
  controlValueAccessor: ControlValueAccessor = null

  constructor(public shortcutService: ShortcutService) {
    makeObservable(this, 'list', '$list')
    subscribe(this, this.$visibleItems, visibleItems => {
      this.udpateColumns(visibleItems)
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

  udpateColumns(visibleItems) {
    if (visibleItems && visibleItems.length > 0) {
      const keys = Object.keys(visibleItems[0])
      const keysChanged = !_.isEqual(
        keys,
        this.$columns().map(c => c.id)
      )
      const shouldUpdateWidths = !this.$columns || keysChanged

      this.$columns.set(
        keys.map(key => {
          if (shouldUpdateWidths) {
            var columnWidth = computeWidth(visibleItems, key)
          } else {
            var columnWidth = this.$columns().find(c => c.id == key).width
          }
          const res = { id: key, width: columnWidth }
          return res
        })
      )

      this.headers = ''
      _.map(this.$columns(), column => {
        let value = column.id.slice(0, column.width).padEnd(column.width)
        return { ...column, string: value }
      }).forEach(column => {
        if (column.id == this.$selectedColumn().id) {
          this.headers += '_' + column.string + '_|'
        } else {
          this.headers += ' ' + column.string + ' |'
        }
      })
    } else {
      this.$columns.set([])
      this.headers = 'No rows'
    }

    function computeWidth(visibleItems: [], key: string) {
      const valuesWidth = visibleItems.map(item => String(item[key]).length)
      const averageWidth = _.sum(valuesWidth) / visibleItems.length
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
        this.udpateColumns(this.$visibleItems.value)
      },
    },
    {
      keys: 'left',
      id: 'left',
      func: () => {
        this.$selectedColumnIndex.update(index => {
          return _.clamp(--index, 0, this.$columns().length - 1)
        })
      },
    },
    {
      keys: 'right',
      id: 'right',
      func: () => {
        this.$selectedColumnIndex.update(index => {
          return _.clamp(++index, 0, this.$columns().length - 1)
        })
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
