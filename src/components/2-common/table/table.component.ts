import {
  Component,
  ContentChild,
  inject,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core'
import _ from 'lodash'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { Command, CommandService, registerCommands } from '../../../commands/command_service'
import { makeObservable, onChange, State, subscribe } from '../../../utils/reactivity'
import { List } from '../list/list'
import { ListItem } from '../list/list_item'
import { PROVIDE_LIST } from '../list/list_on_enter'

@Component({
  selector: 'table',
  template: `
    <box [style]="{ maxHeight: 1 }">{{ headers }}</box>
    <list
      [items]="_items.$"
      [trackByFn]="trackByFn"
      [template]="template || template2"
      (selectedItem)="$selectedItem.next($event)"
      (visibleItems)="$visibleItems.next($event)">
    </list>
  `,
  providers: [
    {
      provide: PROVIDE_LIST,
      useFactory: () => {
        const table = inject(Table)
        return table.$list
      },
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
  hasResized = false

  constructor(public commandService: CommandService) {
    this._items = new State([], this.destroy$)
    onChange(this, 'items', items => {
      this._items.subscribeSource(items)
    })

    makeObservable(this, 'list', '$list')
    subscribe(this, this.$visibleItems, visibleItems => {
      if (!this.hasResized) {
        this.autoResizeColumns(visibleItems)
      }
    })
    registerCommands(this, this.commands)
  }

  autoResizeColumns(visibleItems) {
    if (visibleItems && visibleItems.length > 0) {
      this.hasResized = true
      const keys = Object.keys(visibleItems[0])
      this.columns = _.map(keys, key => {
        const valuesLengths = visibleItems.map(item => String(item[key]).length)
        const averageLength = _.sum(valuesLengths) / visibleItems.length
        const headerSize = _.clamp(key.length, 2, 15)
        const res = { name: key, width: _.clamp(averageLength, headerSize, 30) }
        return res
      })
      this.headers = _.map(this.columns, column => {
        return column.name.slice(0, column.width).padEnd(column.width)
      }).join(' | ')
    } else {
      this.columns = []
      this.headers = 'No Data'
    }
  }

  commands: Partial<Command>[] = [
    {
      keys: 'ctrl+shift+l',
      id: 'resizeColumns',
      func: () => {
        this.hasResized = false
        this.autoResizeColumns(this.$visibleItems.value)
      },
    },
  ]

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
