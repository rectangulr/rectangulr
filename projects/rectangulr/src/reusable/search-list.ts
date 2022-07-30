import { Component, EventEmitter, Input, Output } from '@angular/core'
import Fuse from 'fuse.js'
import { BehaviorSubject, combineLatest, Subject } from 'rxjs'
import { debounceTime, map, takeUntil } from 'rxjs/operators'
import { Logger } from '../lib/logger'
import { State } from '../utils/reactivity'
import { filterNulls } from '../utils/utils'
import { borderTop } from './styles'

@Component({
  selector: 'search-list',
  template: `
    <box [style]="{ flexDirection: 'column' }">
      <tui-input
        [text]="searchText"
        (textChange)="searchTextChange.next($event)"
        [style]="{ backgroundColor: 'gray', color: 'white' }"></tui-input>
      <list
        [items]="matchingItems.$"
        (selectedItem)="selectedItem.next($event)"
        [showIndex]="showIndex"
        [trackByFn]="trackByFn"
        [style]="{ flexShrink: 1 }"></list>
      <!-- <box [style]="{ backgroundColor: 'red', flexGrow: 1 }"></box> -->
    </box>
  `,
})
export class SearchList {
  @Input() set items(items) {
    this._items.subscribeSource(items)
  }
  @Input() searchText = ''
  @Input() showIndex = false
  @Input() searchKeys = []
  @Input() trackByFn = (index, item) => item
  @Input() searchInputVisible = true

  @Output() searchTextChange = new EventEmitter<string>()
  @Output() selectedItem = new BehaviorSubject({ value: null, ref: null })

  _items: State<any[]>
  searchEnabled = true
  searchIndex = new Fuse([], {
    keys: this.searchKeys,
  })
  matchingItems: State<any[]>

  constructor(public logger: Logger) {
    this._items = new State([], this.destroy$)
    this.matchingItems = new State([], this.destroy$)
  }

  ngOnInit() {
    this._items.$.pipe(filterNulls, takeUntil(this.destroy$)).subscribe(items => {
      if (items.length <= 0) {
        this.searchEnabled = false
        this.searchIndex = new Fuse([])
        return
      }

      if (items.length > 20000) {
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
    this.destroy$.next()
    this.destroy$.complete()
  }
}
