import {
  Component,
  ContentChild,
  ElementRef,
  inject,
  Inject,
  Injector,
  Input,
  Optional,
  Output,
  QueryList,
  SkipSelf,
  TemplateRef,
  ViewChildren,
} from '@angular/core'
import * as json5 from 'json5'
import _ from 'lodash'
import { ComponentOutletInjectorDirective } from 'ng-dynamic-component'
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs'
import { map, takeUntil } from 'rxjs/operators'
import { Element, makeRuleset } from '../../../angular-terminal/dom-terminal'
import { ShortcutService, registerCommands } from '../../../commands/shortcut.service'
import { makeObservable, State, subscribe } from '../../../utils/reactivity'
import { async, filterNulls, mapKeyValue } from '../../../utils/utils'
import { whiteOnGray } from '../styles'
import { ListItem } from './list_item'
import { PROVIDE_LIST } from './list_on_enter'

/**
 * Displays a list of items and highlights the current item.
 * Go up and down with the keyboard.
 */
@Component({
  selector: 'list',
  template: `
    <box *ngIf="showIndex">{{ selected.index + 1 }}/{{ _items.value?.length || 0 }}</box>
    <box [style]="{ flexShrink: 0 }">
      <box
        #elementRef
        *ngFor="let item of visibleItems; index as index; trackBy: trackByFn"
        [classes]="[nullOnNull, [whiteOnGray, item == selected.value]]">
        <ng-container
          [ngTemplateOutlet]="template || template2"
          [ngTemplateOutletContext]="{ $implicit: item }"
          [ngTemplateOutletInjector]="injector"></ng-container>

        <ng-container
          *ngIf="!template && !template2 && _displayComponent"
          [ngComponentOutlet]="_displayComponent"
          [ngComponentOutletInjector]="injector"
          [ndcDynamicInputs]="{ data: item }"></ng-container>
      </box>
    </box>
  `,
  providers: [
    {
      provide: PROVIDE_LIST,
      useFactory: () => {
        return of(inject(List))
      },
    },
  ],
})
export class List<T> {
  @Input() set items(items: Observable<T[]> | T[]) {
    this._items.subscribeSource(items)
  }
  @Input() trackByFn = (index, item) => item
  @Input() showIndex = false
  @Input() displayComponent: any
  @Input() template: TemplateRef<any>
  @ContentChild(ListItem, { read: TemplateRef, static: true }) template2: TemplateRef<any>
  @Output('selectedItem') $selectedItem = new BehaviorSubject(null)
  @Output('visibleItems') $visibleItems: Observable<T[]>

  selected = {
    index: 0,
    value: null,
  }

  _items: State<T[]>
  _displayComponent: any
  windowSize = 20
  visibleRange: Range = { start: 0, end: this.windowSize }
  $visibleRange = new BehaviorSubject<Range>(this.visibleRange)
  visibleItems = []

  @ViewChildren('elementRef', { emitDistinctChangesOnly: true }) elementRefs: QueryList<ElementRef>
  @ViewChildren(ComponentOutletInjectorDirective, { emitDistinctChangesOnly: true })
  componentRefs: QueryList<ComponentOutletInjectorDirective>

  constructor(
    @SkipSelf() public shortcutService: ShortcutService,
    @Inject('itemComponent') @Optional() public itemComponentInjected: any,
    public injector: Injector
  ) {
    this._items = new State([], this.destroy$)
    this.$visibleItems = combineLatest([
      this._items.$.pipe(filterNulls),
      this.$visibleRange.pipe(filterNulls),
    ]).pipe(
      takeUntil(this.destroy$),
      map(([items, visibleRange]) => {
        return items.slice(visibleRange.start, visibleRange.end)
      })
    )
  }

  ngOnInit() {
    // assert(this.items == undefined)

    // The way the item is displayed can be customized via an Input, and Injected value, or defaults to a basic json stringify
    this._displayComponent =
      this.displayComponent ?? this.itemComponentInjected ?? BasicObjectDisplay

    this.selectIndex(0)
    subscribe(this, this._items.$, items => {
      this.selectIndex(0)
    })

    registerCommands(this, this.commands)

    makeObservable(this, 'visibleRange', '$visibleRange')

    subscribe(this, this.$visibleItems, visibleItems => {
      this.visibleItems = visibleItems
    })
  }

  selectIndex(value) {
    if (!this._items.value || this._items.value.length == 0) {
      this.selected.index = 0
      this.selected.value = null
      this.$selectedItem.next(null)
      return
    }

    this.selected.index = _.clamp(value, 0, this._items.value.length - 1)
    this.selected.value = this._items.value[this.selected.index]
    this.visibleRange = rangeCenteredAroundIndex(
      this.selected.index,
      this.windowSize,
      this._items.value.length
    )
    this.$selectedItem.next(this.selected.value)

    const afterIndexSelected = () => {
      const selectedComponent = this.componentRefs?.get(this.selected.index)?.componentRef
        .instance as { shortcutService: ShortcutService }
      selectedComponent?.shortcutService?.focus()

      if (this.elementRefs?.length > 0) {
        const element: Element = this.elementRefs.get(
          this.selected.index - this.visibleRange.start
        )?.nativeElement
        element.scrollIntoView()
      }
    }

    async(afterIndexSelected)
  }

  whiteOnGray = whiteOnGray
  nullOnNull = makeRuleset({ backgroundColor: null, color: null })

  commands = [
    {
      keys: 'down',
      func: () => {
        this.selectIndex(this.selected.index + 1)
      },
    },
    {
      keys: 'up',
      func: () => {
        this.selectIndex(this.selected.index - 1)
      },
    },
    {
      keys: 'pgup',
      func: () => {
        this.selectIndex(this.selected.index - this.windowSize)
      },
    },
    {
      keys: 'pgdown',
      func: () => {
        this.selectIndex(this.selected.index + this.windowSize)
      },
    },
  ]

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}

interface Range {
  start: number
  end: number
}

function rangeCenteredAroundIndex(index, rangeSize, length) {
  if (rangeSize < length) {
    let range = { start: index - rangeSize / 2, end: index + rangeSize / 2 }
    if (range.start < 0) return { start: 0, end: rangeSize }
    if (range.end > length) {
      return { start: length - rangeSize, end: length }
    }
    return clampRange(range, 0, length)
  } else {
    return { start: 0, end: length }
  }
}

function clampRange(range, min, max) {
  let newRange = _.clone(range)
  if (newRange.start < min) newRange.start = min
  if (newRange.end > max) newRange.end = max
  return newRange
}

@Component({
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
        this.text = json5.stringify(newObject)
      }
    } else {
      throw new Error(`can't display this`)
    }
  }
}
