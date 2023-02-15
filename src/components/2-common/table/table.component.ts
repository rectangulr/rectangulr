import { Component, ContentChild, Input, Output, TemplateRef, ViewChild } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import _ from 'lodash'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { map } from 'rxjs/operators'
import { Command, registerShortcuts, ShortcutService } from '../../../commands/shortcut.service'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { makeObservable, onChange, State, subscribe } from '../../../utils/reactivity'
import { assert, filterNulls } from '../../../utils/utils'
import { Box } from '../../1-basics/box'
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
    assert(this.table.columns)

    this.text = this.table.columns
      .map(column => {
        const value = this.data[column.name]
        return String(value).slice(0, column.width).padEnd(column.width)
      })
      .join(' | ')
  }
}

@Component({
  standalone: true,
  imports: [Box, List, Row, ListItem],
  selector: 'table',
  template: `
    <box [style]="{ maxHeight: 1 }">{{ headers }}</box>
    <list
      [items]="_items.$"
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
      useFactory: table => table.controlValueAccessor,
      deps: [Table],
    },
  ],
})
export class Table<T> {
  @Input() items: T[] | Observable<T[]>
  @Input() template: TemplateRef<any>
  @Input() trackByFn = (index, item) => item
  @Input() includeKeys: string[] = []
  @Input() excludeKeys: string[] = []
  @ContentChild(ListItem, { read: TemplateRef }) template2: TemplateRef<any>
  @Output('selectedItem') $selectedItem = new BehaviorSubject<T[]>(null)
  @Output('visibleItems') $visibleItems = new BehaviorSubject<T[]>(null)

  _items: State<T[]>
  headers: string = ''
  columns: { name: string; width: number }[] = []
  @ViewChild(List) list: List<T>
  /**
   * To allow the \<list> to be accessed from outside the \<table> using PROVIDE_LIST
   */
  $list = new BehaviorSubject<List<T>>(null)
  rowComponent = Row
  controlValueAccessor: ControlValueAccessor = null

  constructor(public shortcutService: ShortcutService) {
    this._items = new State([], this.destroy$)
    onChange(this, 'items', items => {
      this._items.subscribeSource(items)
    })

    makeObservable(this, 'list', '$list')
    subscribe(this, this.$visibleItems, visibleItems => {
      this.udpateColumns(visibleItems)
    })

    registerShortcuts(this, this.commands)

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
        this.columns.map(c => c.name)
      )
      const shouldUpdateWidths = !this.columns || keysChanged

      this.columns = _.map(keys, key => {
        if (shouldUpdateWidths) {
          var columnWidth = computeWidth(visibleItems, key)
        } else {
          var columnWidth = this.columns.find(c => c.name == key).width
        }
        const res = { name: key, width: columnWidth }
        return res
      })

      this.headers = _.map(this.columns, column => {
        return column.name.slice(0, column.width).padEnd(column.width)
      }).join(' | ')
    } else {
      this.columns = []
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

  commands: Partial<Command>[] = [
    {
      keys: 'ctrl+shift+l',
      id: 'resizeColumns',
      func: () => {
        this.udpateColumns(this.$visibleItems.value)
      },
    },
  ]

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
