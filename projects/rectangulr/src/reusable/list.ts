import {
  Component,
  ElementRef,
  Inject,
  Input,
  Optional,
  Output,
  QueryList,
  SkipSelf,
  ViewChildren,
} from '@angular/core'
import * as json5 from 'json5'
import _ from 'lodash'
import { ComponentOutletInjectorDirective } from 'ng-dynamic-component'
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs'
import { map, takeUntil } from 'rxjs/operators'
import { CommandService, registerCommands } from '../commands/command-service'
import { Element, makeRuleset } from '../mylittledom'
import { onChangeEmit, State } from '../utils/reactivity'
import { filterNulls, mapKeyValue } from '../utils/utils'
import { whiteOnGray } from './styles'

interface Range {
  start: number
  end: number
}

@Component({
  selector: 'list',
  template: `
    <box *ngIf="showIndex">{{ selected.index + 1 }}/{{ _items.value?.length || 0 }}</box>
    <box [style]="{ flexGrow: 1, flexShrink: 1 }">
      <box
        #elementRef
        *ngFor="let item of createdItems; index as index; trackBy: trackByFn"
        [classes]="[nullOnNull, [whiteOnGray, item == selected.value]]">
        <ng-container
          [ngComponentOutlet]="_displayComponent"
          [ndcDynamicInputs]="{ object: item }"></ng-container>
      </box>
    </box>
  `,
})
export class List {
  @Input() displayComponent: any
  _displayComponent: any
  @Input() set items(items: Observable<any[]> | any[]) {
    this._items.subscribeSource(items)
  }
  _items: State<any[]>
  @Input() trackByFn = (index, item) => item
  @Input() showIndex = false

  selected = {
    index: 0,
    value: null,
  }

  windowSize = 20
  createdRange: Range = { start: 0, end: this.windowSize }
  createdRangeChanges = new BehaviorSubject<Range>(null)
  createdItems = []

  @ViewChildren('elementRef', { emitDistinctChangesOnly: true })
  elementRefs: QueryList<ElementRef>
  @ViewChildren(ComponentOutletInjectorDirective, { emitDistinctChangesOnly: true })
  componentRefs: QueryList<ComponentOutletInjectorDirective>

  @Output() selectedItem = new BehaviorSubject({ value: null, ref: null })

  constructor(
    @SkipSelf() public commandService: CommandService,
    @Inject('itemComponent') @Optional() public itemComponentInjected: any
  ) {
    this._items = new State([], this.destroy$)
  }

  ngOnInit() {
    // The way the item is displayed can be customized via an Input, and Injected value, or defaults to a basic json stringify
    this._displayComponent =
      this.displayComponent ?? this.itemComponentInjected ?? BasicObjectDisplay

    this.selectIndex(0)
    this._items.$.pipe(filterNulls, takeUntil(this.destroy$)).subscribe(() => {
      this.selectIndex(0)
    })

    const keybinds = [
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
    registerCommands(this, keybinds)

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
      })
  }

  selectIndex(value) {
    if (!this._items.value || this._items.value.length == 0) {
      this.selectedItem.next({ value: null, ref: null })
      return
    }

    this.selected.index = _.clamp(value, 0, this._items.value.length - 1)
    this.selected.value = this._items.value[this.selected.index]
    this.createdRange = rangeCenteredAroundIndex(
      this.selected.index,
      this.windowSize,
      this._items.value.length
    )
    this.selectedItem.next({ value: this.selected.value, ref: null })

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

function rangeCenteredAroundIndex(index, rangeSize, max) {
  if (rangeSize < max) {
    let range = { start: index - rangeSize / 2, end: index + rangeSize / 2 }
    if (range.start < 0) return { start: 0, end: rangeSize }
    if (range.end > max) {
      return { start: max - rangeSize, end: max }
    }
    return clampRange(range, 0, max)
  } else {
    return { start: 0, end: max }
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

  ngOnInit() {
    const type = typeof this.object
    if (type == 'string' || type == 'number') {
      this.text = this.object
    } else if (type == 'object') {
      this.includeKeys = this.includeKeys || Object.keys(this.object)
      if (this.object.name) {
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
