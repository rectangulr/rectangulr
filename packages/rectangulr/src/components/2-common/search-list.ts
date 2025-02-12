import {
  Component,
  computed,
  ContentChild,
  inject,
  input,
  model,
  Output,
  TemplateRef,
  ViewChild
} from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import Fuse from 'fuse.js'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { debounceTime, map } from 'rxjs/operators'
import { LOGGER } from '../../angular-terminal/logger'
import { FocusDirective } from '../../commands/focus.directive'
import { makeObservable } from '../../utils/reactivity'
import { patchInputSignal } from '../../utils/Signal2'
import { V } from '../1-basics/v'
import { Style } from '../1-basics/style'
import { TextInput } from '../1-basics/text-input'
import { NotificationsService } from './app-shell/notifications.service'
import { List } from './list/list'
import { ListItem } from './list/list-item'
import { borderTop } from './styles'

@Component({
  selector: 'search-list',
  template: `
    <v>
      @if (searchInputVisible()) {
        <text-input
          [text]="searchText()"
          (textChange)="searchTextChange.next($event)"
          [focusIf]="focusInputIf()"
          [s]="{ backgroundColor: 'gray', color: 'white' }"/>
      }
      <list
        [items]="matchingItems()"
        (selectedItem)="selectedItem.next($event)"
        onItemsChangeSelect="first"
        [trackByFn]="trackByFn()"
        [template]="template() || template2">
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
  imports: [V, TextInput, FocusDirective, List, Style]
})
export class SearchList<T> {
  items = input.required<T[]>()
  $items = toObservable(this.items)

  readonly searchText = input('')
  readonly searchKeys = input([])
  readonly trackByFn = input((index, item) => item)
  readonly searchInputVisible = input(true)
  readonly focusInputIf = input(false)
  readonly template = input<TemplateRef<any>>(undefined)

  @ViewChild(List) list: List<T>
  @ContentChild(ListItem, { read: TemplateRef }) template2: TemplateRef<any>

  @Output() searchTextChange = new BehaviorSubject(this.searchText())
  @Output() selectedItem = new BehaviorSubject(null)

  searchEnabled = model(true)
  searchIndex = new Fuse([], { keys: this.searchKeys() })

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

  notificationService = inject(NotificationsService)

  logger = inject(LOGGER)

  ngOnInit() {
    const items = patchInputSignal(this.items)
    items.subscribe(items => {
      if (items.length <= 0) {
        this.searchEnabled.set(false)
        return
      }

      if (items.length > 20_000) {
        this.searchEnabled.set(false)
        this.notificationService.notify({ name: 'search disabled. list too long' })
        return
      }

      this.searchEnabled.set(true)
      const firstItem = items[0]
      Object.entries(firstItem).forEach(([key, value]) => {
        if (['string', 'number'].includes(typeof value)) {
          this.searchKeys().push(key)
        }
      })
      this.searchIndex = new Fuse(items, { keys: this.searchKeys() })
    })
    // effect(() => {
    //   console.log(this.matchingItems())
    // })

    makeObservable(this, 'list', '$list')
  }

  borderTop = borderTop
}
