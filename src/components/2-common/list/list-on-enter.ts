import { Directive, EventEmitter, inject, InjectionToken, Output } from '@angular/core'
import { Observable, Subject } from 'rxjs'
import { registerShortcuts } from '../../../commands/shortcut.service'
import { makeProperty, subscribe } from '../../../utils/reactivity'
import { assert } from '../../../utils/utils'
import { List } from './list'

export const PROVIDE_LIST = new InjectionToken<Observable<List<any>>>('List Token')

@Directive({
  standalone: true,
  selector: '[onEnter]',
})
export class OnEnterDirective {
  @Output() onEnter = new EventEmitter()

  list: List<any> = null
  selectedItem = null

  commands = [
    {
      keys: 'enter',
      func: key => {
        if (this.list._items.value.length == 0) {
          return key
        }
        this.onEnter.emit(this.selectedItem)
      },
    },
  ]

  constructor() {
    const $list = inject(PROVIDE_LIST)
    assert($list)

    subscribe(this, $list, list => {
      if (!list) return

      this.list = list

      registerShortcuts(list, this.commands)

      makeProperty(this, list.$selectedItem, 'selectedItem')
    })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
