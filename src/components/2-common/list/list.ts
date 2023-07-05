import { NgComponentOutlet, NgFor, NgIf, NgTemplateOutlet } from '@angular/common'
import {
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
  effect,
  signal
} from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import _ from 'lodash'
import { DynamicModule } from 'ng-dynamic-component'
import { Observable, Subject } from 'rxjs'
import { Element, makeRuleset } from '../../../angular-terminal/dom-terminal'
import { Logger } from '../../../angular-terminal/logger'
import { FocusDirective } from '../../../commands/focus.directive'
import { Command, ShortcutService, registerShortcuts } from '../../../commands/shortcut.service'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { subscribe } from '../../../utils/reactivity'
import { assert, inputToSignal } from '../../../utils/utils'
import { GrowDirective, HBox, VBox } from '../../1-basics/box'
import { ClassesDirective, NewClassesDirective } from '../../1-basics/classes'
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
    <hbox *ngIf="showIndex">{{ selected.index + 1 }}/{{ $items()?.length || 0 }}</hbox>
    <vbox [style]="{ flexShrink: 0, scroll: 'y' }">
      <vbox
        #elementRef
        *ngFor="
          let item of $visibleItems();
          index as index;
          count as count;
          first as first;
          last as last;
          even as even;
          odd as odd;
          trackBy: trackByFn
        "
        [classes]="[[styleItem && item == selected.value, s.whiteOnGray]]">
        <ng-container
          [ngTemplateOutlet]="template || template2 || defaultTemplate"
          [ngTemplateOutletContext]="{
            $implicit: item,
            index: index,
            count: count,
            first: first,
            last: last,
            even: even,
            odd: odd,
            selected: item == selected.value
          }"></ng-container>

        <!-- <ng-container
          *ngIf="!template && !template2 && _displayComponent"
          [ngComponentOutlet]="_displayComponent"
          [ndcDynamicInputs]="{ data: item }"></ng-container> -->
      </vbox>
    </vbox>

    <ng-template #defaultTemplate let-item let-selected>
      <basic-object-display
        [data]="item"
        [classes]="[s.nullOnNull, [selected, s.whiteOnGray]]"></basic-object-display>
    </ng-template>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useFactory: list => list.controlValueAccessor,
      deps: [List],
      multi: true,
    },
  ],
  imports: [
    NgFor,
    NgIf,
    NgComponentOutlet,
    NgTemplateOutlet,
    HBox,
    ClassesDirective,
    DynamicModule,
    BasicObjectDisplay,
    GrowDirective,
    NewClassesDirective,
    VBox,
  ],
})
export class List<T> {
  @Input() items: T[] | Observable<T[]> | Signal<T[]> = undefined
  @Input() trackByFn = (index, item) => item
  @Input() showIndex = false
  @Input() displayComponent: any = undefined
  @Input() template: TemplateRef<any> = undefined
  @Input() onItemsChangeSelect: 'nothing' | 'last' | 'first' | 'same' = 'same'
  @Input() onInitSelect: 'first' | 'last' = 'first'
  @Input() styleItem = true
  // @Input() focusPath: Signal<JsonPath | null> = signal(null)

  @ContentChild(ListItem, { read: TemplateRef, static: true }) template2: TemplateRef<any>
  @Output('selectedItem') $selectedItem = new EventEmitter<T>()
  @Output('visibleItems') $$visibleItems = null

  $items = signal([])
  // $focusPath = signal(null)

  $selectedIndex = signal(undefined)

  selected = {
    index: undefined,
    value: undefined,
  }

  windowSize = 20
  $visibleRange = signal({ start: 0, end: this.windowSize })
  $visibleItems: Signal<any[]>

  _displayComponent = undefined
  controlValueAccessor = new BaseControlValueAccessor<T>()
  @ViewChildren('elementRef', { emitDistinctChangesOnly: true }) elementRefs: QueryList<ElementRef>
  @ContentChildren(FocusDirective) focusRefs: QueryList<FocusDirective>

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
    registerShortcuts(this, this.shortcuts)
  }

  ngOnInit() {
    // The way the item is displayed can be customized via an Input, and Injected value, or defaults to a basic json stringify
    this._displayComponent = this.itemComponentInjected

    const selectNewIndex = () => {
      const items = this.$items()
      if (!items) return
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
    effect(() => selectNewIndex(), { injector: this.injector, allowSignalWrites: true })
  }

  /**
   * Tries to select the index `value`
   * @param value The index to select
   * @returns Returns false if the index got clamped, or if there's no items in the list
   */
  selectIndex(value): boolean {
    if (!this.$items() || this.$items().length == 0) {
      this.selected.index = null
      this.selected.value = null
      return false
    }

    this.selected.index = _.clamp(value, 0, this.$items().length - 1)
    this.selected.value = this.$items()[this.selected.index]
    this.$selectedItem.emit(this.selected.value)

    this.$visibleRange.set(
      rangeCenteredAroundIndex(this.selected.index, this.windowSize, this.$items().length)
    )

    // this.logger.log(`selectIndex - ${this.selected.index}`)
    setTimeout(() => {
      this.afterViewUpdate()
    })

    return this.selected.index == value
  }

  afterViewUpdate() {
    assert(this.focusRefs)

    if (this.focusRefs.length > 0) {
      const selectedFocusDirective = this.focusRefs?.get(this.selected.index)
      if (!selectedFocusDirective) {
        debugger
      }
      selectedFocusDirective.shortcutService.requestFocus({ reason: 'List selectIndex' })
    }

    if (this.elementRefs?.length > 0) {
      const element: Element = this.elementRefs.get(
        this.selected.index - this.$visibleRange().start
      )?.nativeElement
      element?.scrollIntoView({ direction: 'y' })
    }
  }

  @Input() s = {
    whiteOnGrayStyle: { backgroundColor: 'dimgray', color: 'white' },
    nullOnNullStyle: { backgroundColor: 'inherit', color: 'inherit' },

    whiteOnGray: whiteOnGray,
    nullOnNull: makeRuleset({ backgroundColor: 'inherit', color: 'inherit' }),
  }

  shortcuts: Partial<Command>[] = [
    {
      keys: 'down',
      func: key => {
        const success = this.selectIndex(this.selected.index + 1)
        if (!success) return key
      },
    },
    {
      keys: 'up',
      func: key => {
        const success = this.selectIndex(this.selected.index - 1)
        if (!success) return key
      },
    },
    {
      keys: 'pgup',
      func: key => {
        const success = this.selectIndex(this.selected.index - this.windowSize)
        if (!success) return key
      },
    },
    {
      keys: 'pgdown',
      func: key => {
        const success = this.selectIndex(this.selected.index + this.windowSize)
        if (!success) return key
      },
    },
  ]

  toString() {
    const items = this.$items()
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
  const index = list.$items().indexOf(item)
  assert(index !== -1, 'item not in list')
  list.selectIndex(index)
}

function clampRange(range, min, max) {
  let newRange = _.clone(range)
  if (newRange.start < min) newRange.start = min
  if (newRange.end > max) newRange.end = max
  return newRange
}
