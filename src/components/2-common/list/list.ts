import { NgComponentOutlet, NgFor, NgIf, NgTemplateOutlet } from '@angular/common'
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
  effect,
  signal,
  untracked
} from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import _ from 'lodash'
import { DynamicModule } from 'ng-dynamic-component'
import { Observable, Subject } from 'rxjs'
import { Element } from '../../../angular-terminal/dom-terminal'
import { cond, eq } from '../../../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'
import { Logger } from '../../../angular-terminal/logger'
import { FocusDirective } from '../../../commands/focus.directive'
import { Command, ShortcutService, registerShortcuts } from '../../../commands/shortcut.service'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { subscribe } from '../../../utils/reactivity'
import { assert, inputToSignal } from '../../../utils/utils'
import { GrowDirective, HBox, VBox } from '../../1-basics/box'
import { StyleDirective } from '../../1-basics/style'
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
    <h *ngIf="showIndex">{{ $selectedIndex() + 1 }}/{{ $items()?.length || 0 }}</h>
    <v [s]="{ flexShrink: 0, scroll: 'y' }">
      <v
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
        (mousedown)="selectVisibleIndex(index)"
        [s]="cond($isItemSelected(item), style.whiteOnGray)">
        <!-- TODO: only style if selected -->
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
            selected: $isItemSelected(item)
          }"></ng-container>

        <!-- <ng-container
          *ngIf="!template && !template2 && _displayComponent"
          [ngComponentOutlet]="_displayComponent"
          [ndcDynamicInputs]="{ data: item }"></ng-container> -->
      </v>
    </v>

    <ng-template #defaultTemplate let-item let-selected>
      <basic-object-display [data]="item" [s]="[cond(selected, style.whiteOnGray)]"/>
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
    DynamicModule,
    BasicObjectDisplay,
    GrowDirective,
    VBox,
    StyleDirective,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List<T> {
  /**
   * The item to be displayed in the list.
   * Can be an array, a signal<array> or an observable<array>.
   */
  @Input() items: T[] | Observable<T[]> | Signal<T[]> = undefined
  /**
   * A trackByFn. Same as for *ngFor.
   */
  @Input() trackByFn = (index, item) => item
  /**
   * TODO: remove
   */
  @Input() showIndex = false
  /**
   * What a line of this list should contain
   * This is an alternative to `template`. You can provide a component instead of a template.
   */
  @Input() displayComponent: any = undefined
  /**
   * What a line of this list should contain
   */
  @Input() template: TemplateRef<any> = undefined
  /**
   * What item to select when the list is updated
   */
  @Input() onItemsChangeSelect: 'nothing' | 'last' | 'first' | 'same' = 'same'
  /**
   * What item to select when the list is created
   */
  @Input() onInitSelect: 'first' | 'last' = 'first'
  /**
   * Should the list add a style to the selected line
   */
  @Input() styleItem = true
  // @Input() focusPath: Signal<JsonPath | null> = signal(null)

  @ContentChild(ListItem, { read: TemplateRef, static: true }) template2: TemplateRef<any>
  /**
   * Emits when the selected line changes.
   */
  @Output('selectedItem') $selectedItem = new EventEmitter<T>()
  /**
   * Emits the currently visible lines of the list.
   */
  @Output('visibleItems') $$visibleItems = null

  $items = signal([])
  // $focusPath = signal(null)

  $selectedIndex = signal<number | null>(null)
  $selectedValue = computed(() => {
    const index = this.$selectedIndex()
    if (index === null) {
      return null
    } else {
      return this.$items()[this.$selectedIndex()]
    }
  })

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
        const index = items.indexOf(this.$selectedValue())
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
    effect(() => {
      this.$items()
      untracked(() => selectNewIndex())
    }, { injector: this.injector, allowSignalWrites: true })
  }

  /**
   * Tries to select the index `value`
   * @param value The index to select
   * @returns Returns false if the index got clamped, or if there's no items in the list
   */
  selectIndex(value): boolean {
    if (!this.$items() || this.$items().length == 0) {
      this.$selectedIndex.set(null)
      return false
    }

    this.$selectedIndex.set(_.clamp(value, 0, this.$items().length - 1))
    this.$selectedItem.emit(this.$selectedValue())

    this.$visibleRange.set(
      rangeCenteredAroundIndex(this.$selectedIndex(), this.windowSize, this.$items().length)
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

    // RequestFocus
    if (this.focusRefs.length > 0) {
      const selectedFocusDirective = this.focusRefs?.get(this.$selectedIndex())
      if (!selectedFocusDirective) {
        debugger
      }
      selectedFocusDirective.shortcutService.requestFocus({ reason: 'List selectIndex' })
    }

    // ScrollIntoView
    if (this.elementRefs?.length > 0) {
      const element: Element = this.elementRefs.get(
        this.$selectedIndex() - this.$visibleRange().start
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
        const success = this.selectIndex(this.$selectedIndex() + 1)
        if (!success) return key
      },
    },
    {
      keys: 'up',
      func: key => {
        const success = this.selectIndex(this.$selectedIndex() - 1)
        if (!success) return key
      },
    },
    {
      keys: 'pgup',
      func: key => {
        const success = this.selectIndex(this.$selectedIndex() - this.windowSize)
        if (!success) return key
      },
    },
    {
      keys: 'pgdown',
      func: key => {
        const success = this.selectIndex(this.$selectedIndex() + this.windowSize)
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

  $isItemSelected(item) {
    return computed(() => item == this.$selectedValue())
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
