import {
  Component,
  ContentChild,
  inject,
  input,
  Input,
  Output,
  TemplateRef,
  ViewChild
} from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import Fuse from 'fuse.js'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { debounceTime, map } from 'rxjs/operators'
import { Logger } from '../../angular-terminal/logger'
import { FocusDirective } from '../../commands/focus.directive'
import { makeObservable } from '../../utils/reactivity'
import { patchInputSignal } from '../../utils/Signal2'
import { GrowDirective, HBox, VBox } from '../1-basics/box'
import { StyleDirective } from '../1-basics/style'
import { TextInput } from '../1-basics/text-input'
import { List } from './list/list'
import { ListItem } from './list/list-item'
import { borderTop } from './styles'

@Component({
  selector: 'search-list',
  template: `
    <v>
      @if (searchInputVisible) {
        <text-input
          [text]="searchText"
          (textChange)="searchTextChange.next($event)"
          [focusIf]="focusInputIf"
          [s]="{ backgroundColor: 'gray', color: 'white' }"/>
      }
      <list
        [items]="matchingItems()"
        (selectedItem)="selectedItem.next($event)"
        onItemsChangeSelect="first"
        [trackByFn]="trackByFn"
        [template]="template || template2">
      </list>
    </v>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useFactory: () => {
        const searchList = inject(SearchList)
        return searchList.$list
      },
    },
  ],
  standalone: true,
  imports: [HBox, VBox, TextInput, FocusDirective, List, GrowDirective, StyleDirective],
})
export class SearchList<T> {
  items = input.required<T[]>()
  $items = toObservable(this.items)

  @Input() searchText = ''
  @Input() searchKeys = []
  @Input() trackByFn = (index, item) => item
  @Input() searchInputVisible = true
  @Input() focusInputIf = false
  @Input() template: TemplateRef<any>
  @ViewChild(List) list: List<T>
  @ContentChild(ListItem, { read: TemplateRef }) template2: TemplateRef<any>

  @Output() searchTextChange = new BehaviorSubject(this.searchText)
  @Output() selectedItem = new BehaviorSubject(null)

  searchEnabled = true
  searchIndex = new Fuse([], {
    keys: this.searchKeys,
  })
  matchingItemsObservable = combineLatest([this.$items, this.searchTextChange]).pipe(
    debounceTime(100),
    map(([items, searchText]) => {
      if (this.searchEnabled && searchText && searchText.length >= 2) {
        return this.searchIndex.search(searchText).map(result => result.item)
      } else {
        return items
      }
    })
  )
  matchingItems = toSignal(this.matchingItemsObservable, { initialValue: [] })
  $list = new BehaviorSubject<List<T>>(null)

  constructor(public logger: Logger) {
    const items = patchInputSignal(this.items)
    items.subscribe(items => {
      if (items.length <= 0) {
        this.searchEnabled = false
        this.searchIndex = new Fuse([])
        return
      }

      if (items.length > 20_000) {
        this.searchEnabled = false
        this.searchIndex = new Fuse([])
        this.searchText = 'search disabled. list too long'
        return
      }

      this.searchEnabled = true
      this.searchKeys = []
      const firstItem = items[0]
      Object.entries(firstItem).forEach(([key, value]) => {
        if (['string', 'number'].includes(typeof value)) {
          this.searchKeys.push(key)
        }
      })
      this.searchIndex = new Fuse(items, { keys: this.searchKeys })
    })
    // effect(() => {
    //   console.log(this.matchingItems())
    // })

    makeObservable(this, 'list', '$list')
  }

  borderTop = borderTop
}
