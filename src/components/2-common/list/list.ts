import { NgComponentOutlet, NgFor, NgIf, NgTemplateOutlet } from '@angular/common'
import {
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  Optional,
  Output,
  QueryList,
  SkipSelf,
  TemplateRef,
  ViewChildren,
} from '@angular/core'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import _ from 'lodash'
import { DynamicModule } from 'ng-dynamic-component'
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  Subject,
  isObservable,
  Subscription,
} from 'rxjs'
import { map, takeUntil } from 'rxjs/operators'
import { Element, makeRuleset } from '../../../angular-terminal/dom-terminal'
import { Logger } from '../../../angular-terminal/logger'
import { FocusDirective } from '../../../commands/focus.directive'
import { Command, registerShortcuts, ShortcutService } from '../../../commands/shortcut.service'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { makeObservable, onChange, subscribe } from '../../../utils/reactivity'
import { assert, filterNulls } from '../../../utils/utils'
import { Box } from '../../1-basics/box'
import { ClassesDirective } from '../../1-basics/classes'
import { whiteOnGray } from '../styles'
import { BasicObjectDisplay } from './basic-object-display'
import { ListItem } from './list-item'

/**
 * Displays a list of items and highlights the current item.
 * Go up and down with the keyboard.
 */
@Component({
  standalone: true,
  selector: 'list',
  template: `
    <box *ngIf="showIndex">{{ selected.index + 1 }}/{{ $items.value?.length || 0 }}</box>
    <box [style]="{ flexShrink: 0 }">
      <box
        #elementRef
        *ngFor="let item of visibleItems; index as index; trackBy: trackByFn"
        [classes]="[nullOnNull, [whiteOnGray, item == selected.value]]">
        <ng-container
          [ngTemplateOutlet]="template || template2 || defaultTemplate"
          [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>

        <ng-container
          *ngIf="!template && !template2 && _displayComponent"
          [ngComponentOutlet]="_displayComponent"
          [ndcDynamicInputs]="{ data: item }"></ng-container>
      </box>
    </box>

    <ng-template #defaultTemplate let-item>
      <basic-object-display [data]="item"></basic-object-display>
    </ng-template>
  `,
  imports: [
    NgFor,
    NgIf,
    NgComponentOutlet,
    NgTemplateOutlet,
    Box,
    ClassesDirective,
    DynamicModule,
    BasicObjectDisplay,
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useFactory: list => list.controlValueAccessor, deps: [List] },
  ],
})
export class List<T> {
  @Input('items') itemsInput: T[] | Observable<T[]>
  @Input() trackByFn = (index, item) => item
  @Input() showIndex = false
  @Input() displayComponent: any
  @Input() template: TemplateRef<any>
  @Input() onItemsChangeSelect: 'nothing' | 'last' | 'first' | 'same' = 'same'
  @ContentChild(ListItem, { read: TemplateRef, static: true }) template2: TemplateRef<any>
  @Output('selectedItem') $selectedItem = new EventEmitter<T>()
  @Output('visibleItems') $visibleItems: Observable<T[]>

  selected = {
    index: undefined,
    value: undefined,
  }

  $items = new BehaviorSubject([])
  itemsSubscription: Subscription = undefined

  _displayComponent = undefined
  windowSize = 20
  visibleRange: Range = { start: 0, end: this.windowSize }
  $visibleRange = new BehaviorSubject(this.visibleRange)
  visibleItems = []
  controlValueAccessor = new BaseControlValueAccessor<T>()

  @ViewChildren('elementRef', { emitDistinctChangesOnly: true }) elementRefs: QueryList<ElementRef>
  @ContentChildren(FocusDirective) focusRefs: QueryList<FocusDirective>

  constructor(
    @SkipSelf() public shortcutService: ShortcutService,
    @Inject('itemComponent') @Optional() public itemComponentInjected: any,
    public logger: Logger
  ) {
    onChange(this, 'itemsInput', input => {
      if (isObservable(input)) {
        this.itemsSubscription?.unsubscribe()
        this.itemsSubscription = subscribe(this, input, value => {
          // @ts-ignore
          this.$items.next(value)
        })
      } else {
        this.$items.next(input)
      }
    })

    makeObservable(this, 'visibleRange', '$visibleRange')

    this.$visibleItems = combineLatest([
      this.$items.pipe(filterNulls),
      this.$visibleRange.pipe(filterNulls),
    ]).pipe(
      takeUntil(this.destroy$),
      map(([items, visibleRange]) => {
        return items.slice(visibleRange.start, visibleRange.end)
      })
    )

    subscribe(this, this.$selectedItem, newValue => {
      this.controlValueAccessor.emitChange(newValue)
    })
    registerShortcuts(this, this.shortcuts)
  }

  ngOnInit() {
    // The way the item is displayed can be customized via an Input, and Injected value, or defaults to a basic json stringify
    this._displayComponent =
      this.displayComponent ?? this.itemComponentInjected ?? BasicObjectDisplay

    subscribe(this, this.$items.pipe(filterNulls), items => {
      if (this.onItemsChangeSelect == 'first') {
        this.selectIndex(0)
      } else if (this.onItemsChangeSelect == 'last') {
        this.selectIndex(items.length - 1)
      } else if (this.onItemsChangeSelect == 'same') {
        const index = items.indexOf(this.selected.value)
        if (index != -1) {
          this.selectIndex(index)
        } else {
          this.selectIndex(0)
        }
      } else if (this.onItemsChangeSelect == 'nothing') {
        // nothing
      }
    })

    subscribe(this, this.$visibleItems, visibleItems => {
      this.visibleItems = visibleItems
    })
  }

  selectIndex(value) {
    if (!this.$items.value || this.$items.value.length == 0) {
      this.selected.index = null
      this.selected.value = null
      return
    }

    this.selected.index = _.clamp(value, 0, this.$items.value.length - 1)
    this.selected.value = this.$items.value[this.selected.index]
    this.$selectedItem.emit(this.selected.value)

    this.visibleRange = rangeCenteredAroundIndex(
      this.selected.index,
      this.windowSize,
      this.$items.value.length
    )

    // this.logger.log(`selectIndex - ${this.selected.index}`)
    setTimeout(() => {
      this.afterViewUpdate()
    })
  }

  afterViewUpdate() {
    assert(this.focusRefs)

    if (this.focusRefs.length > 0) {
      const selectedFocusDirective = this.focusRefs?.get(this.selected.index)
      if (!selectedFocusDirective) {
        debugger
      }
      selectedFocusDirective.shortcutService.requestFocus()
    }

    if (this.elementRefs?.length > 0) {
      const element: Element = this.elementRefs.get(
        this.selected.index - this.visibleRange.start
      )?.nativeElement
      element?.scrollIntoView()
    }
  }

  whiteOnGray = whiteOnGray
  nullOnNull = makeRuleset({ backgroundColor: null, color: null })

  shortcuts: Partial<Command>[] = [
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

  toString() {
    const items = this.$items.value
    // .map(i => json5.stringify(i)).join()
    return `List: ${items.length}`
  }

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

export function selectItem(list: List<any>, item: any) {
  const index = list.$items.value.indexOf(item)
  assert(index !== -1, 'item not in list')
  list.selectIndex(index)
}

function clampRange(range, min, max) {
  let newRange = _.clone(range)
  if (newRange.start < min) newRange.start = min
  if (newRange.end > max) newRange.end = max
  return newRange
}
