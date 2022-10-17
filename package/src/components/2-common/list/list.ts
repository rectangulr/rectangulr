import {
  Component,
  ContentChild,
  ElementRef,
  Inject,
  Injector,
  Input,
  Optional,
  Output,
  QueryList,
  SkipSelf,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core'
import * as json5 from 'json5'
import * as _ from 'lodash'
import { ComponentOutletInjectorDirective } from 'ng-dynamic-component'
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs'
import { map, takeUntil } from 'rxjs/operators'
import { Element, makeRuleset } from '../../../angular-terminal/dom-terminal'
import { CommandService, registerCommands } from '../../../commands/command-service'
import { onChangeEmit, State } from '../../../lib/reactivity'
import { assert, filterNulls, mapKeyValue } from '../../../lib/utils'
import { whiteOnGray } from '../styles'
import { ListItem } from './list_item'

interface Range {
  start: number
  end: number
}

/**
 * Display a list of items and highlight the current item.
 * Go up and down with the keyboard.
 */
@Component({
  selector: 'list',
  template: `
    <box *ngIf="showIndex">{{ selected.index + 1 }}/{{ _items.value?.length || 0 }}</box>
    <box [style]="{ flexShrink: 0 }">
      <box
        #elementRef
        *ngFor="let item of createdItems; index as index; trackBy: trackByFn"
        [classes]="[nullOnNull, [whiteOnGray, item == selected.value]]">
        <ng-container
          [ngTemplateOutlet]="template || template2"
          [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>

        <ng-container
          *ngIf="!template && !template2 && _displayComponent"
          [ngComponentOutlet]="_displayComponent"
          [ndcDynamicInputs]="{ object: item }"></ng-container>
      </box>
    </box>
  `,
})
export class List<T> {
  @Input() displayComponent: any
  @Input() set items(items: Observable<ArrayLike<T>> | ArrayLike<T>) {
    this._items.subscribeSource(items)
  }
  @Input() trackByFn = (index, item) => item
  @Input() showIndex = false
  @Input() template: TemplateRef<any>
  @ContentChild(ListItem, { read: TemplateRef, static: true }) template2: TemplateRef<any>

  @Output() selectedItem = new BehaviorSubject({ value: null, viewRef: null })

  selected = {
    index: 0,
    value: null,
  }

  _items: State<T[]>
  _displayComponent: any
  windowSize = 20
  createdRange: Range = { start: 0, end: this.windowSize }
  createdRangeChanges = new BehaviorSubject<Range>(null)
  createdItems = [] as string[]
  stats: { [prop: string]: { nb: number; total: number } }

  @ViewChildren('elementRef', { emitDistinctChangesOnly: true })
  elementRefs: QueryList<ElementRef>
  @ViewChildren(ComponentOutletInjectorDirective, {
    emitDistinctChangesOnly: true,
  })
  componentRefs: QueryList<ComponentOutletInjectorDirective>

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
        this.selectIndex(0)
      },
    },
    {
      keys: 'pgdown',
      func: () => {
        this.selectIndex(this._items.value.length - 1)
      },
    },
  ]

  constructor(
    @SkipSelf() public commandService: CommandService,
    @Inject('itemComponent') @Optional() public itemComponentInjected: any,
    public injector: Injector
  ) {
    this._items = new State([], this.destroy$)
  }

  ngOnInit() {
    // assert(this.items == undefined)

    // The way the item is displayed can be customized via an Input, and Injected value, or defaults to a basic json stringify
    this._displayComponent =
      this.displayComponent ?? this.itemComponentInjected ?? BasicObjectDisplay

    this.selectIndex(0)
    this._items.$.pipe(filterNulls, takeUntil(this.destroy$)).subscribe(() => {
      this.selectIndex(0)
    })

    registerCommands(this, this.commands)

    onChangeEmit(this, 'createdRange', 'createdRangeChanges')

    combineLatest([this._items.$.pipe(filterNulls), this.createdRangeChanges])
      .pipe(
        takeUntil(this.destroy$),
        map(([items, createdRange]) => {
          return items.slice(createdRange.start, createdRange.end)
        })
      )
      .subscribe(createdItems => {
        this.createdItems = createdItems
        this.stats = {}
        for (const item of createdItems) {
          for (const [key, value] of Object.entries(item)) {
            this.stats[key] ??= { nb: 0, total: 0 }
            this.stats[key].nb++
            this.stats[key].total += String(value).length
          }
        }
      })
  }

  selectIndex(value) {
    if (!this._items.value || this._items.value.length == 0) {
      this.selectedItem.next({ value: null, viewRef: null })
      return
    }

    this.selected.index = _.clamp(value, 0, this._items.value.length - 1)
    this.selected.value = this._items.value[this.selected.index]
    this.createdRange = rangeCenteredAroundIndex(
      this.selected.index,
      this.windowSize,
      this._items.value.length
    )
    this.selectedItem.next({ value: this.selected.value, viewRef: null })

    const afterIndexSelected = () => {
      const selectedComponent = this.componentRefs?.get(this.selected.index)?.componentRef
        .instance as { commandService: CommandService }
      selectedComponent?.commandService?.focus()

      if (this.elementRefs?.length > 0) {
        const element: Element = this.elementRefs.get(
          this.selected.index - this.createdRange.start
        )?.nativeElement
        element.scrollIntoView()
      }
    }

    setTimeout(afterIndexSelected, 0)
  }

  whiteOnGray = whiteOnGray
  nullOnNull = makeRuleset({ backgroundColor: null, color: null })

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
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
  @Input() object: any
  @Input() includeKeys: string[]
  @Input() excludeKeys: string[] = []
  text = 'error'

  constructor(public list: List<any>) {}

  ngOnInit() {
    const type = typeof this.object
    if (this.object == null) {
      this.text = 'null'
    } else if (type == 'string' || type == 'number') {
      this.text = this.object
    } else if (type == 'object') {
      this.includeKeys = this.includeKeys || Object.keys(this.object)
      if (this.object.name != undefined) {
        this.text = this.object.name
      } else {
        const newObject = mapKeyValue(this.object, (key, value) => {
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

@Component({
  template: `<box [style]="{ height: 1 }">{{ text }}</box>`,
})
export class TableObjectDisplay {
  @Input() object: any
  @Input() includeKeys: string[]
  @Input() excludeKeys: string[] = []
  text = 'error'

  constructor(public list: List<any>) {
    list.stats
  }

  ngOnInit() {
    assert(this.object)
    assert(typeof this.object == 'object')
    assert(this.list.stats)

    this.includeKeys = this.includeKeys || Object.keys(this.object)
    const newObject = mapKeyValue(this.object, (key, value) => {
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
        return String(value).slice(0, averageLength)
      })
      .join('')
  }
}
