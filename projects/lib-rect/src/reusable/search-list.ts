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
      <list
        [items]="matchingItems.$"
        (selectedItem)="selectedItem.next($event)"
        [showIndex]="showIndex"
        [trackByFn]="trackByFn"
        [style]="{ flexShrink: 1 }"></list>
      <box [style]="{ backgroundColor: 'red', flexGrow: 1 }"></box>
      <tui-input
        [text]="searchText"
        (textChange)="searchTextChange.next($event)"
        [style]="{ backgroundColor: 'gray', color: 'white' }"></tui-input>
    </box>
  `,
})
export class SearchList {
  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  @Input() set items(items) {
    this._items.subscribeSource(items)
  }
  _items = new State([], this.destroy$)
  @Input() searchText = ''
  @Input() showIndex = false
  @Input() searchKeys = []
  @Input() trackByFn = (index, item) => item

  @Output() searchTextChange = new EventEmitter<string>()
  @Output() selectedItem = new BehaviorSubject({ value: null, ref: null })

  searchIndex = new Fuse([], {
    keys: this.searchKeys,
  })
  matchingItems = new State([], this.destroy$)

  constructor(public logger: Logger) {}

  ngOnInit() {
    this._items.$.pipe(filterNulls, takeUntil(this.destroy$)).subscribe(items => {
      if (items.length <= 0) return
      this.searchKeys = []
      Object.entries(items[0]).forEach(([key, value]) => {
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
          if (searchText && searchText.length >= 2) {
            return this.searchIndex.search(searchText).map(result => result.item)
          } else {
            return items
          }
        })
      )
    )
  }

  borderTop = borderTop
}
