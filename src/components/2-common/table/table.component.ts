import {
  Component,
  ContentChild,
  ElementRef,
  Injector,
  Input,
  Output,
  Signal,
  TemplateRef,
  ViewChild,
  computed,
  effect,
  signal,
} from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import * as json5 from 'json5'
import _ from 'lodash'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { map } from 'rxjs/operators'
import { Element, makeRuleset } from '../../../angular-terminal/dom-terminal'
import { Command, ShortcutService, registerShortcuts } from '../../../commands/shortcut.service'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { makeObservable, subscribe } from '../../../utils/reactivity'
import { assert, filterNulls, inputToSignal } from '../../../utils/utils'
import { HBox } from '../../1-basics/box'
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
    assert(this.table.$columns())

    this.text = computed(() => {
      const columns = this.table.$columns()
      const selectedColumn = this.table.$selectedColumn()
      const selectedItem = this.table.$selectedItem()

      let line = ''

      columns
        .map(column => {
          let value = this.data[column.id]

          if (typeof value == 'string') {
            value = String(value)
          } else if (value === undefined) {
            value = 'undefined'
          } else if (value === null) {
            value = ''
          } else {
            value = json5.stringify(value)
          }

          return { ...column, string: value.slice(0, column.width).padEnd(column.width) }
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
  selector: 'table',
  host: { '[style]': `{scroll: 'x'}` },
  template: `
    <hbox [style]="{ maxHeight: 1 }" [classes]="[s.header]">{{ $headers() }}</hbox>
    <list
      #list
      [items]="items"
      [trackByFn]="trackByFn"
      [template]="template || template2 || defaultRowTemplate"
      (selectedItem)="$selectedItem.set($event)"
      (visibleItems)="$visibleItems.set($event)"
      [style]="{ hgrow: true }">
      <ng-template #defaultRowTemplate>
        <row [style]="{ flexShrink: 0 }" *item="let item" [data]="item"></row>
      </ng-template>
    </list>
  `,
  imports: [HBox, List, Row, ListItem, ClassesDirective],
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
  // @Output('selectedItem') $$selectedItem = new BehaviorSubject<T>(null)

  $items = signal([])
  $visibleItems = signal([])
  $selectedColumnIndex = signal<number | null>(0)
  $selectedItem = signal(null)

  @Output('selectedItem') $$selectedItem = toObservable(this.$selectedItem)
  @Output('visibleItems') $$visibleItems = toObservable(this.$visibleItems)

  $columns = computed(() => {
    return this.computeColumnWidths(this.$items())
  })
  $selectedColumn = computed(() => this.$columns()[this.$selectedColumnIndex()])
  $headers = computed(() => {
    return this.computeHeaders(this.$columns(), this.$selectedColumn())
  })

  @ViewChild(List) list: List<T>
  $list = new BehaviorSubject<List<T>>(null)
  controlValueAccessor: ControlValueAccessor = null

  constructor(
    public shortcutService: ShortcutService,
    public elementRef: ElementRef<Element>,
    public injector: Injector
  ) {
    makeObservable(this, 'list', '$list')
    inputToSignal(this, 'items', '$items')

    // Scroll to selected column
    effect(() => {
      const columns = this.$columns()
      const index = this.$selectedColumnIndex()

      if (columns.length == 0 || index > columns.length - 1) return
      let range = { start: 0, end: 0 }
      for (let i = 0; i <= index; i++) {
        if (i < index) range.start += columns[i].width + 3
        range.end += columns[i].width + 3
      }
      if (range.start < elementRef.nativeElement.scrollRect.x) {
        this.elementRef.nativeElement.scrollColumnIntoView(range.start)
      } else {
        this.elementRef.nativeElement.scrollColumnIntoView(range.end)
      }
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

  computeHeaders(columns: Column[], selectedColumn: Column) {
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
      const valuesWidth = items.map(item => {
        if (item === item[key]) {
          return 4
        }
        return String(item[key]).length
      })
      const max = _.max(valuesWidth)
      return _.clamp(max, key.length, 50)
    }
  }

  selectColumnIndex(index: number) {
    const columns = this.$columns()
    if (!columns || columns.length == 0) {
      this.$selectedColumnIndex.set(null)
      return
    }

    const realIndex = _.clamp(index, 0, columns.length - 1)
    this.$selectedColumnIndex.set(realIndex)
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
