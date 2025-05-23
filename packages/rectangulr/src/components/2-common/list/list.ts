import { NgTemplateOutlet } from '@angular/common'
import {
  Component,
  ElementRef,
  Injector,
  TemplateRef,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChildren
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import { clamp, clone, isNil, isObject } from '@s-libs/micro-dash'
import { Subject, fromEvent } from 'rxjs'
import { TermElement } from '../../../angular-terminal/dom-terminal'
import { cond, eq } from '../../../angular-terminal/dom-terminal/style/StyleHandler'
import { LOGGER } from '../../../angular-terminal/logger'
import { FocusDirective } from '../../../commands/focus.directive'
import { Command, ShortcutService, registerShortcuts } from '../../../commands/shortcut.service'
import { Mouse } from '../../../term-strings/parse'
import { assert } from '../../../utils/Assert'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { Deferred } from '../../../utils/Deferred'
import { patchInputSignal, signal2 } from '../../../utils/Signal2'
import { Style } from '../../1-basics/Style.directive'
import { V } from '../../1-basics/v'
import { BasicObjectDisplay } from './basic-object-display'
import { ListItem } from './list-item'

/**
 * Displays a list of items and highlights the current item.
 * Go up and down with the keyboard.
 */
@Component({
  selector: 'list',
  template: `
    @for (item of visibleItems(); track trackByFn()($index,item)) {
      <v
        #elementRef
        (mousedown)="selectVisibleIndex($index)"
        [s]="{flexShrink: 0}"
        [st]="[this.itemStyle]"
        [stv]="{index: $index}"
        >
        <ng-container
          [ngTemplateOutlet]="template() || template2() || defaultTemplate"
          [ngTemplateOutletContext]="{
            $implicit: item,
            index: $index,
            selected: eq($index, selectedIndex)
        }"/>
      </v>
    }

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
  standalone: true,
  imports: [NgTemplateOutlet, BasicObjectDisplay, V, Style]
})
export class List<T> {
  /**
   * The items to be displayed in the list.
   * Can be an array, a signal<array> or an observable<array>.
   */
  items = input.required<T[]>()

  /**
   * A trackByFn. Same as for *ngFor.
   */
  readonly trackByFn = input((index: number, item: T) => item)

  /**
   * What a line of this list should contain
   * This is an alternative to `template`. You can provide a component instead of a template.
   */
  readonly displayComponent = input<any | undefined>(undefined)

  /**
   * What a line of this list should contain
   */
  readonly template = input<TemplateRef<any> | undefined>(undefined)

  /**
   * What item to select when the list is updated
   */
  readonly onItemsChangeSelect = input<'last' | 'first' | 'same'>('same')

  /**
   * What item to select when the list is created
   */
  readonly onInitSelect = input<'first' | 'last'>('first')

  /**
   * Should the list add a style to the selected line
   */
  readonly styleItem = input(true)

  itemStyle = (templateVars) => computed(() => {
    if (templateVars['index']() === this.selectedVisibleIndex()) {
      return this.S().listItem
    } else {
      return {}
    }
  })

  // readonly focusPath = input<Signal<JsonPath | null>>(signal(null));

  readonly template2 = contentChild(ListItem, { read: TemplateRef });

  // $focusPath = signal(null)

  selectedIndex = signal2<number | undefined>(undefined)

  selectedValue = computed(() => {
    const index = this.selectedIndex()
    if (index === undefined) {
      return undefined
    } else {
      return this.items()[index]
    }
  })

  windowSize = 20
  visibleRange = signal({ start: 0, end: this.windowSize })
  visibleItems = computed(() => {
    const visibleRange = this.visibleRange()
    const items = this.items()
    if (items != null && visibleRange != null) {
      return items.slice(visibleRange.start, visibleRange.end)
    } else {
      return []
    }
  })
  selectedVisibleIndex = computed(() => {
    return this.selectedIndex() - this.visibleRange().start
  })

  _displayComponent = undefined
  controlValueAccessor = new BaseControlValueAccessor<T>()
  elementRefs = viewChildren('elementRef', { read: ElementRef })
  focusRefs = contentChildren(FocusDirective)

  /**
   * Emits when the selected line changes.
   */
  $selectedItem = output<T | null>({ alias: 'selectedItem' })

  /**
   * Emits when the selected line changes.
   */
  selectedIndexOutput = output<number | undefined>({ alias: 'selectedIndex' })

  /**
   * Emits the currently visible lines of the list.
   */
  visibleItemsOutput = output<T[]>({ alias: 'visibleItems' })

  deferreds: Deferred<any>[] = []
  previousItems: T[]

  shortcutService = inject(ShortcutService)
  logger = inject(LOGGER)
  // itemComponentInjected = inject('itemComponent', {optional: true})
  injector = inject(Injector)

  protected el = inject<ElementRef<TermElement & Element>>(ElementRef).nativeElement

  constructor() {
    // inputToSignal(this, 'focusPath', '$focusPath')

    // effect(() => {
    //   const indexToFocus = this.$focusPath()[0]
    //   this.selectIndex(indexToFocus)
    // })

    this.$selectedItem.subscribe(newValue => {
      this.controlValueAccessor.emitChange(newValue)
    })
    this.selectedIndex.subscribe(index => {
      this.selectedIndexOutput.emit(index)
    })
    this.visibleItemsOutput.subscribe(items => {
      this.visibleItemsOutput.emit(items)
    })
    // TODO: unsubscribe

    registerShortcuts(this.shortcuts)

    effect(() => {
      this.focusRefs()
      this.elementRefs()
      untracked(() => { this.afterViewUpdate() })
    })

    this.el.style.add({ scrollF: 'y' })

    fromEvent(this.el, 'mousewheel')
      .pipe(takeUntilDestroyed())
      .subscribe(e => {
        const event = e['mouse'] as Mouse
        this.el.scrollTop += event.d * 2
        this.visibleRange.update(range => {
          return moveRange(range, event.d * 2, 0, this.items().length)
        })
      })
  }

  ngOnInit() {
    // The way the item is displayed can be customized via an Input, and Injected value, or defaults to a basic json stringify
    // this._displayComponent = this.itemComponentInjected

    const selectNewIndex = (items: T[]) => {
      assert(!isNil(items))
      const onItemsChangeSelect = this.onItemsChangeSelect()
      if (onItemsChangeSelect == 'first') {
        this.selectIndex(0)
      } else if (onItemsChangeSelect == 'last') {
        this.selectIndex(items.length - 1)
      } else if (onItemsChangeSelect == 'same') {
        let index = this.selectedIndex()
        if (isNil(index) /* If there's no previous selected item */) {
          this.selectIndex(0)
          return
        }
        // If the selectedValue is an object, we select the value again
        // If its a primitive value, we select the index again
        const value = this.selectedValue()
        if (value && isObject(value)) {
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
      const items = this.items()
      const onInitSelectValue = this.onInitSelect()
      if (onInitSelectValue == 'first') {
        this.selectIndex(0)
      } else if (onInitSelectValue == 'last') {
        this.selectIndex(items.length - 1)
      }
    }
    onInitSelect()

    const items = patchInputSignal(this.items)
    items.subscribe(items => selectNewIndex(items))
  }

  /**
   * Tries to select the index `value`
   * @param value The index to select
   * @returns Returns false if the index got clamped, or if there's no items in the list
   */
  selectIndex(value: number): Promise<boolean> {
    assert(!isNil(this.items()))

    if (!this.items() || this.items().length == 0) {
      this.selectedIndex.set(undefined)
    } else {
      this.selectedIndex.set(clamp(value, 0, this.items().length - 1))
    }

    this.$selectedItem.emit(this.selectedValue())

    this.visibleRange.set(
      rangeCenteredAroundIndex(this.selectedIndex.$, this.windowSize, this.items().length)
    )

    const deferred = new Deferred<boolean>()
    deferred.value = this.selectedIndex() === value

    if (this.items() != this.previousItems) {
      // wait for focusRefs to settle before
      // RequestFocus
      // ScrollIntoView
      this.deferreds.push(deferred)
    } else {
      // Do it straight away
      // RequestFocus
      // ScrollIntoView
      this.afterViewUpdate()
      deferred.resolve(deferred.value)
    }
    this.previousItems = this.items()

    return deferred.promise
  }

  selectVisibleIndex(visibleIndex: number) {
    const index = this.visibleRange().start + visibleIndex
    return this.selectIndex(index)
  }

  afterViewUpdate() {
    assert(this.focusRefs())

    if (this.selectedIndex.$ !== undefined) {
      // RequestFocus
      if (this.focusRefs().length > 0) {
        const selectedFocus = this.focusRefs().at(this.selectedVisibleIndex())
        if (!selectedFocus) {
          debugger
        }
        assert(selectedFocus)
        selectedFocus.shortcutService.requestFocus({ reason: 'List selectIndex' })
      }

      // ScrollIntoView
      if (this.elementRefs().length > 0) {
        assert(this.selectedIndex.$ !== undefined)
        const element: TermElement = this.elementRefs().at(
          this.selectedVisibleIndex()
        )?.nativeElement
        element?.scrollIntoView({ direction: 'y' })
      }
    }
    this.deferreds.forEach(def => def.resolve(def.value))
  }

  readonly S = input({
    listItem: { backgroundColor: 'dimgray', color: 'white' },
  })

  shortcuts: Partial<Command>[] = [
    {
      keys: 'down',
      func: key => {
        if (this.selectedIndex.$ == undefined) return
        const success = this.selectIndex(this.selectedIndex.$ + 1)
        if (!success) return key
      },
    },
    {
      keys: 'up',
      func: key => {
        if (this.selectedIndex.$ == undefined) return
        const success = this.selectIndex(this.selectedIndex.$ - 1)
        if (!success) return key
      },
    },
    {
      keys: 'pgup',
      func: key => {
        if (this.selectedIndex.$ == undefined) return
        const success = this.selectIndex(this.selectedIndex.$ - this.windowSize)
        if (!success) return key
      },
    },
    {
      keys: 'pgdown',
      func: key => {
        if (this.selectedIndex.$ == undefined) return
        const success = this.selectIndex(this.selectedIndex.$ + this.windowSize)
        if (!success) return key
      },
    },
  ]

  toString() {
    const items = this.items()
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
  const index = list.items().indexOf(item)
  assert(index !== -1, 'item not in list')
  return list.selectIndex(index)
}

function clampRange(range: { start: number; end: number }, min: number, max: number) {
  let newRange = clone(range)
  if (newRange.start < min) newRange.start = min
  if (newRange.end > max) newRange.end = max
  return newRange
}

function moveRange(range: Range, delta: number, min: number, max: number) {
  let clampedDelta = clamp(delta, -range.start, max - range.end)
  return { start: range.start + clampedDelta, end: range.end + clampedDelta }
}
