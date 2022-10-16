import { Component, Input, Output, TemplateRef } from '@angular/core'
import Fuse from 'fuse.js'
import { BehaviorSubject, combineLatest, NEVER, Subject } from 'rxjs'
import { debounceTime, map, takeUntil } from 'rxjs/operators'
import { Logger } from '../../angular-terminal/logger'
import { State } from '../../lib/reactivity'
import { filterNulls } from '../../lib/utils'
import { borderTop } from './styles'

@Component({
  selector: 'search-list',
  template: `
    <box [style]="{ flexDirection: 'column' }">
      <tui-input
        *ngIf="searchInputVisible"
        [text]="searchText"
        [focus]="focusInput"
        (textChange)="searchTextChange.next($event)"
        [style]="{ backgroundColor: 'gray', color: 'white' }"></tui-input>
      <list
        [items]="matchingItems.$"
        (selectedItem)="selectedItem.next($event)"
        [showIndex]="showIndex"
        [trackByFn]="trackByFn"
        [template]="template"
        >
      </list>
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
  @Input() focusInput = NEVER

  @Output() searchTextChange = new BehaviorSubject(this.searchText)
  @Output() selectedItem = new BehaviorSubject({ value: null, viewRef: null })

  _items: State<any[]>
  searchEnabled = true
  searchIndex = new Fuse([], {
    keys: this.searchKeys,
  })
  matchingItems: State<any[]>

  @Input() template: TemplateRef<any>

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
    this.destroy$.next()
    this.destroy$.complete()
  }
}
