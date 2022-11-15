import {
  Component,
  ContentChild,
  inject,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core'
import { BehaviorSubject, Subject } from 'rxjs'
import { makeObservable, onChange, State, subscribe } from '../../../utils/reactivity'
import { List } from '../list/list'
import { ListItem } from '../list/list_item'
import { PROVIDE_LIST } from '../list/list_on_enter'

@Component({
  selector: 'table',
  template: ` <box *ngFor="let header of headers">{{ header.name }}</box>
    <list
      [items]="_items.$"
      (selectedItem)="selectedItem.next($event)"
      [showIndex]="true"
      [trackByFn]="trackByFn"
      [template]="template || template2">
    </list>`,
  providers: [
    {
      provide: PROVIDE_LIST,
      useFactory: () => {
        const table = inject(TableComponent)
        return table.$list
      },
    },
  ],
})
export class TableComponent<T> {
  @Input() items: ArrayLike<T>
  @Input() template: TemplateRef<any>
  @Input() trackByFn = (index, item) => item
  @Output() selectedItem = new BehaviorSubject({ value: null, viewRef: null })

  _items: State<ArrayLike<T>>
  $list = new BehaviorSubject<List<T>>(null)
  headers = []

  @ContentChild(ListItem, { read: TemplateRef }) template2: TemplateRef<any>
  @ViewChild(List) list: List<T>

  constructor() {
    this._items = new State([], this.destroy$)
    onChange(this, 'items', items => {
      this._items.subscribeSource(items)
    })
    subscribe(this, this._items.$, items => {})

    makeObservable(this, 'list', '$list')
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
