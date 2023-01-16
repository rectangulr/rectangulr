import {
  Component,
  ContentChild,
  inject,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core'
import Fuse from 'fuse.js'
import { BehaviorSubject, combineLatest, NEVER, Subject } from 'rxjs'
import { debounceTime, map, takeUntil } from 'rxjs/operators'
import { Logger } from '../../angular-terminal/logger'
import { FocusDirective } from '../../commands/focus'
import { makeObservable, State } from '../../utils/reactivity'
import { filterNulls } from '../../utils/utils'
import { Box } from '../1-basics/box'
import { TextInput } from '../1-basics/text-input'
import { List } from './list/list'
import { ListItem } from './list/list-item'
import { PROVIDE_LIST } from './list/list-on-enter'
import { borderTop } from './styles'

@Component({
  standalone: true,
  imports: [Box, TextInput, FocusDirective, List],
  selector: 'search-list',
  template: `
    <box [style]="{ flexDirection: 'column' }">
      <text-input
        *ngIf="searchInputVisible"
        [text]="searchText"
        (textChange)="searchTextChange.next($event)"
        [focusIf]="focusInputIf"
        [style]="{ backgroundColor: 'gray', color: 'white' }"></text-input>
      <list
        [items]="matchingItems.$"
        (selectedItem)="selectedItem.next($event)"
        [showIndex]="showIndex"
        [trackByFn]="trackByFn"
        [template]="template || template2">
      </list>
    </box>
  `,
  providers: [
    {
      provide: PROVIDE_LIST,
      useFactory: () => {
        const searchList = inject(SearchList)
        return searchList.$list
      },
    },
  ],
})
export class SearchList<T> {
  @Input() set items(items) {
    this._items.subscribeSource(items)
  }
  @Input() searchText = ''
  @Input() showIndex = false
  @Input() searchKeys = []
  @Input() trackByFn = (index, item) => item
  @Input() searchInputVisible = true
  @Input() focusInputIf = false
  @Input() template: TemplateRef<any>
  @ViewChild(List) list: List<T>
  @ContentChild(ListItem, { read: TemplateRef }) template2: TemplateRef<any>

  @Output() searchTextChange = new BehaviorSubject(this.searchText)
  @Output() selectedItem = new BehaviorSubject(null)

  _items: State<T[]>
  searchEnabled = true
  searchIndex = new Fuse([], {
    keys: this.searchKeys,
  })
  matchingItems: State<T[]>
  $list = new BehaviorSubject<List<T>>(null)

  constructor(public logger: Logger) {
    this._items = new State([], this.destroy$)
    this.matchingItems = new State([], this.destroy$)
    makeObservable(this, 'list', '$list')
  }

  ngOnInit() {
    this._items.$.pipe(filterNulls, takeUntil(this.destroy$)).subscribe(items => {
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

    this.matchingItems.subscribeSource(
      combineLatest([this._items.$, this.searchTextChange]).pipe(
        debounceTime(100),
        map(([items, searchText]) => {
          if (this.searchEnabled && searchText && searchText.length >= 2) {
            return this.searchIndex.search(searchText).map(result => result.item)
          } else {
            return items
          }
        })
      )
    )
  }

  borderTop = borderTop

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
