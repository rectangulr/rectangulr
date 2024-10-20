import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Inject,
  Injector,
  Input,
  Optional,
  Output,
  QueryList,
  Signal,
  TemplateRef,
  ViewChildren,
  computed,
  inject,
  signal
} from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import * as _ from 'lodash'
import { Observable, Subject } from 'rxjs'
import { Element } from '../../../angular-terminal/dom-terminal'
import { cond, eq } from '../../../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'
import { Logger } from '../../../angular-terminal/logger'
import { FocusDirective } from '../../../commands/focus.directive'
import { Command, ShortcutService, registerShortcuts } from '../../../commands/shortcut.service'
import { assert } from '../../../utils/Assert'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { subscribe } from '../../../utils/reactivity'
import { signal2 } from '../../../utils/Signal2'
import { inputToSignal } from '../../../utils/utils'
import { GrowDirective, HBox, VBox } from '../../1-basics/box'
import { StyleDirective, TemplateStyle } from '../../1-basics/style'
import { whiteOnGray } from '../styles'
import { BasicObjectDisplay } from './basic-object-display'
import { ListItem } from './list-item'

/**
 * Displays a list of items and highlights the current item.
 * Go up and down with the keyboard.
 */
@Component({
  selector: 'list',
  template: `
    <v [s]="{ flexShrink: 0, scrollF: 'y' }">
      @for (item of $visibleItems(); track trackByFn($index,item)) {
        <v
          #elementRef
          (mousedown)="selectVisibleIndex($index)"
          [st]="[this.itemStyle]"
          [stv]="{index: $index}"
          >
          <ng-container
            [ngTemplateOutlet]="template || template2 || defaultTemplate"
            [ngTemplateOutletContext]="{
              $implicit: item,
              index: $index,
              selected: eq($index, $selectedIndex)
          }"/>
      </v>
    }
    </v>

    <ng-template #defaultTemplate let-item let-selected>
      <basic-object-display [data]="item" />
    </ng-template>
    `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useFactory: () => inject(List).controlValueAccessor,
      multi: true,
    },
  ],
  imports: [
    NgComponentOutlet,
    NgTemplateOutlet,
    HBox,
    BasicObjectDisplay,
    GrowDirective,
    VBox,
    StyleDirective
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List<T> {
  /**
   * The item to be displayed in the list.
   * Can be an array, a signal<array> or an observable<array>.
   */
  @Input() items!: T[] | Observable<T[]> | Signal<T[]>

  /**
   * A trackByFn. Same as for *ngFor.
   */
  @Input() trackByFn = (index: number, item: T) => item

  /**
   * What a line of this list should contain
   * This is an alternative to `template`. You can provide a component instead of a template.
   */
  @Input() displayComponent: any | undefined = undefined
  /**
   * What a line of this list should contain
   */
  @Input() template: TemplateRef<any> | undefined
  /**
   * What item to select when the list is updated
   */
  @Input() onItemsChangeSelect: 'last' | 'first' | 'same' = 'same'

  /**
   * What item to select when the list is created
   */
  @Input() onInitSelect: 'first' | 'last' = 'first'

  /**
   * Should the list add a style to the selected line
   */
  @Input() styleItem = true

  itemStyle: TemplateStyle

  // @Input() focusPath: Signal<JsonPath | null> = signal(null)

  @ContentChild(ListItem, { read: TemplateRef, static: true }) template2: TemplateRef<any> | undefined

  /**
   * Emits when the selected line changes.
   */
  @Output('selectedItem') $selectedItem = new EventEmitter<T | null>()

  /**
   * Emits when the selected line changes.
   */
  @Output('selectedIndex') selectedIndexOutput = new EventEmitter<number>(false)

  /**
   * Emits the currently visible lines of the list.
   */
  @Output('visibleItems') $$visibleItems!: Observable<any>

  $items = signal2<T[]>([])

  // $focusPath = signal(null)

  $selectedIndex = signal2<number | undefined>(undefined)

  $selectedValue = computed(() => {
    const index = this.$selectedIndex()
    if (index === undefined) {
      return undefined
    } else {
      return this.$items()[index]
    }
  })

  windowSize = 20
  $visibleRange = signal({ start: 0, end: this.windowSize })
  $visibleItems: Signal<any[]>

  _displayComponent = undefined
  controlValueAccessor = new BaseControlValueAccessor<T>()
  @ViewChildren('elementRef', { emitDistinctChangesOnly: true }) elementRefs!: QueryList<ElementRef>
  @ContentChildren(FocusDirective) focusRefs!: QueryList<FocusDirective>

  constructor(
    public shortcutService: ShortcutService,
    @Inject('itemComponent') @Optional() public itemComponentInjected: any,
    public logger: Logger,
    public injector: Injector
  ) {
    inputToSignal(this, 'items', '$items')
    // inputToSignal(this, 'focusPath', '$focusPath')

    this.$visibleItems = computed(() => {
      const visibleRange = this.$visibleRange()
      const items = this.$items()
      if (items != null && visibleRange != null) {
        return items.slice(visibleRange.start, visibleRange.end)
      } else {
        return []
      }
    })

    this.$$visibleItems = toObservable(this.$visibleItems)

    // effect(() => {
    //   const indexToFocus = this.$focusPath()[0]
    //   this.selectIndex(indexToFocus)
    // })

    subscribe(this, this.$selectedItem, newValue => {
      this.controlValueAccessor.emitChange(newValue)
    })

    this.$selectedIndex.subscribe(index => {
      this.selectedIndexOutput.emit(this.$selectedIndex())
    })
    registerShortcuts(this.shortcuts)
  }

  ngOnInit() {
    // The way the item is displayed can be customized via an Input, and Injected value, or defaults to a basic json stringify
    this._displayComponent = this.itemComponentInjected

    const selectNewIndex = (items: T[]) => {
      assert(!_.isNil(items))
      if (this.onItemsChangeSelect == 'first') {
        this.selectIndex(0)
      } else if (this.onItemsChangeSelect == 'last') {
        this.selectIndex(items.length - 1)
      } else if (this.onItemsChangeSelect == 'same') {
        let index = this.$selectedIndex()
        if (_.isNil(index)) {
          this.selectIndex(0)
          return
        }
        assert(index !== undefined)
        const value = this.$selectedValue()
        if (value && _.isObject(value)) {
          index = items.indexOf(value)
        }
        if (index != -1) {
          this.selectIndex(index)
        } else {
          this.selectIndex(0)
        }
      }
    }
    const onInitSelect = () => {
      const items = this.$items()
      if (this.onInitSelect == 'first') {
        this.selectIndex(0)
      } else if (this.onInitSelect == 'last') {
        this.selectIndex(items.length - 1)
      }
    }
    onInitSelect()
    this.$items.subscribe(items => selectNewIndex(items))
    this.itemStyle = (signals) => computed(() => {
      if (signals['index']() === this.$selectedIndex()) {
        return this.style.whiteOnGray
      } else {
        return []
      }
    })
  }

  /**
   * Tries to select the index `value`
   * @param value The index to select
   * @returns Returns false if the index got clamped, or if there's no items in the list
   */
  selectIndex(value: number): boolean {
    assert(!_.isNil(this.$items()))

    if (!this.$items() || this.$items().length == 0) {
      this.$selectedIndex.set(undefined)
      return false
    }

    this.$selectedIndex.set(_.clamp(value, 0, this.$items().length - 1))
    this.$selectedItem.emit(this.$selectedValue())

    assert(this.$selectedIndex.$ !== undefined)
    this.$visibleRange.set(
      rangeCenteredAroundIndex(this.$selectedIndex.$, this.windowSize, this.$items().length)
    )

    // this.logger.log(`selectIndex - ${this.$selectedIndex()}`)
    setTimeout(() => {
      this.afterViewUpdate()
    })

    return this.$selectedIndex() === value
  }

  selectVisibleIndex(visibleIndex: number) {
    const index = this.$visibleRange().start + visibleIndex
    return this.selectIndex(index)
  }

  afterViewUpdate() {
    assert(this.focusRefs)
    assert(this.$selectedIndex.$ !== undefined)

    // RequestFocus
    if (this.focusRefs.length > 0) {
      const selectedFocusDirective = this.focusRefs?.get(this.$selectedIndex.$)
      if (!selectedFocusDirective) {
        debugger
      }
      assert(selectedFocusDirective)
      selectedFocusDirective.shortcutService.requestFocus({ reason: 'List selectIndex' })
    }

    // ScrollIntoView
    if (this.elementRefs?.length > 0) {
      assert(this.$selectedIndex.$ !== undefined)
      const element: Element = this.elementRefs.get(
        this.$selectedIndex.$ - this.$visibleRange().start
      )?.nativeElement
      element?.scrollIntoView({ direction: 'y' })
    }
  }

  @Input() style = {
    whiteOnGray: whiteOnGray,
    nullOnNull: { backgroundColor: 'inherit', color: 'inherit' },
  }

  shortcuts: Partial<Command>[] = [
    {
      keys: 'down',
      func: key => {
        assert(this.$selectedIndex.$ !== undefined)
        const success = this.selectIndex(this.$selectedIndex.$ + 1)
        if (!success) return key
      },
    },
    {
      keys: 'up',
      func: key => {
        assert(this.$selectedIndex.$ !== undefined)
        const success = this.selectIndex(this.$selectedIndex.$ - 1)
        if (!success) return key
      },
    },
    {
      keys: 'pgup',
      func: key => {
        assert(this.$selectedIndex.$ !== undefined)
        const success = this.selectIndex(this.$selectedIndex.$ - this.windowSize)
        if (!success) return key
      },
    },
    {
      keys: 'pgdown',
      func: key => {
        assert(this.$selectedIndex.$ !== undefined)
        const success = this.selectIndex(this.$selectedIndex.$ + this.windowSize)
        if (!success) return key
      },
    },
  ]

  toString() {
    const items = this.$items()
    // .map(i => json5.stringify(i)).join()
    return `List: ${items?.length ?? 0}`
  }

  computed = computed
  cond = cond
  eq = eq

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

function rangeCenteredAroundIndex(index: number, rangeSize: number, length: number) {
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
  const index = list.$items().indexOf(item)
  assert(index !== -1, 'item not in list')
  list.selectIndex(index)
}

function clampRange(range: { start: number; end: number }, min: number, max: number) {
  let newRange = _.clone(range)
  if (newRange.start < min) newRange.start = min
  if (newRange.end > max) newRange.end = max
  return newRange
}
