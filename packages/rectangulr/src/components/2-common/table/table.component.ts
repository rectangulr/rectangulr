import { Component, ElementRef, Injector, Output, Signal, TemplateRef, computed, contentChild, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import json5 from 'json5'
import * as _ from 'lodash-es'
import { Subject } from 'rxjs'
import { Element } from '../../../angular-terminal/dom-terminal'
import { addStyle } from '../../../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'
import { Command, ShortcutService, registerShortcuts } from '../../../commands/shortcut.service'
import { H } from '../../../components/1-basics/h'
import { assert } from '../../../utils/Assert'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { computed2, signal2 } from '../../../utils/Signal2'
import { TODO } from '../../../utils/utils'
import { Style } from '../../1-basics/style'
import { List } from '../list/list'
import { ListItem } from '../list/list-item'

@Component({
  standalone: true,
  selector: 'row',
  template: `{{ text() }}`,
})
export class Row<T extends { [key: string | symbol]: any }> {
  table = inject<Table<T>>(Table);

  readonly data = input.required<T>();
  text!: Signal<string>

  constructor() {
    addStyle({ height: 1 })
  }

  ngOnInit() {
    assert(this.data())
    // assert(typeof this.data == 'object')
    assert(this.table.$columns())

    this.text = computed(() => {
      const data = this.data()
      if (typeof data == 'object') {
        const columns = this.table.$columns()
        const selectedColumn = this.table.$selectedColumn()
        const selectedItem = this.table.$selectedItem()

        let line = ''

        columns
          .map(column => {
            let value = this.data()[column.id]

            if (typeof value == 'string' || typeof value == 'bigint') {
              value = String(value)
            } else if (value === undefined) {
              value = 'undefined'
            } else if (value === null) {
              value = ''
            } else {
              value = json5.stringify(value)
            }
            assert(typeof value == 'string')

            return { ...column, string: value.slice(0, column.width).padEnd(column.width) }
          })
          .forEach(column => {
            if (selectedColumn && column.id == selectedColumn.id && this.data() == selectedItem) {
              line += '>' + column.string + '<|'
            } else {
              line += ' ' + column.string + ' |'
            }
          })

        return line
      } else {
        return String(data)
      }
    })
  }
}

interface Column {
  id: string
  width: number
}

@Component({
  selector: 'table',
  template: `
    <h [s]="s.header">{{ $headers() }}</h>
    <list
      #list
      [items]="items()"
      [trackByFn]="trackByFn()"
      [template]="template() || template2() || defaultRowTemplate"
      (selectedItem)="$selectedItem.set($event)"
      (visibleItems)="$visibleItems.set($event)"
      [s]="{ hgrow: true}">
    </list>
    <ng-template #defaultRowTemplate [item] let-item>
      <row [data]="item" [s]="{ flexShrink: 0 }"></row>
    </ng-template>
  `,
  imports: [H, List, Row, ListItem, Style],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useFactory: (table: Table<any>) => table.controlValueAccessor,
      deps: [Table],
    },
  ]
})
export class Table<T> {
  shortcutService = inject(ShortcutService)
  elementRef = inject<ElementRef<Element>>(ElementRef)
  injector = inject(Injector)

  items = input.required<T[]>()
  readonly template = input<TemplateRef<any> | undefined>(undefined);
  readonly trackByFn = input((index: number, item: T) => item);
  readonly includeKeys = input<string[]>([]);
  readonly excludeKeys = input<string[]>([]);

  readonly template2 = contentChild(ListItem, { read: TemplateRef });
  readonly selectedItem = output<T | null>();

  // $items = signal([])
  $visibleItems = signal<T[]>([])
  $selectedColumnIndex = signal2<number | null>(0)
  $selectedItem = signal<T | null>(null)

  @Output('selectedItem') $$selectedItem = toObservable(this.$selectedItem)
  @Output('visibleItems') $$visibleItems = toObservable(this.$visibleItems)

  $columns = computed(() => {
    return this.computeColumnWidths(this.items())
  })
  $selectedColumn = computed2(() => {
    assert(this.$selectedColumnIndex.$ !== null)
    return this.$columns()[this.$selectedColumnIndex.$]
  })
  $headers = computed(() => {
    return this.computeHeaders(this.$columns(), this.$selectedColumn())
  })

  readonly list = viewChild.required(List);
  controlValueAccessor: ControlValueAccessor = new BaseControlValueAccessor()

  constructor() {
    const elementRef = this.elementRef

    addStyle({ scrollF: 'x' })
    // inputToSignal(this, 'items', '$items')

    // Scroll to selected column
    effect(() => {
      const columns = this.$columns()
      const index = this.$selectedColumnIndex()
      assert(index !== null)

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

    registerShortcuts(this.shortcuts)

    effect(() => {
      const newControlValueAccessor = this.list().controlValueAccessor
      untracked(() => {
        newControlValueAccessor.onChangeHandlers.forEach((handler: TODO) =>
          newControlValueAccessor.registerOnChange(handler)
        )
        newControlValueAccessor.onTouchHandlers.forEach((handler: TODO) =>
          newControlValueAccessor.registerOnTouched(handler)
        )
        assert(newControlValueAccessor.setDisabledState)
        newControlValueAccessor.setDisabledState(newControlValueAccessor.disabled)
      })
    })
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
      assert(max)
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
        this.computeColumnWidths(this.items())
      },
    },
    {
      keys: 'left',
      func: () => {
        assert(this.$selectedColumnIndex.$ !== null)
        this.selectColumnIndex(this.$selectedColumnIndex.$ - 1)
      },
    },
    {
      keys: 'right',
      func: () => {
        assert(this.$selectedColumnIndex.$ !== null)
        this.selectColumnIndex(this.$selectedColumnIndex.$ + 1)
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
    header: { backgroundColor: 'gray', color: 'white', maxHeight: 1 },
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
