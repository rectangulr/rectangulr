import { Directive, EventEmitter, inject, InjectionToken, Output } from '@angular/core'
import { Observable, Subject } from 'rxjs'
import { registerCommands } from '../../../commands/command_service'
import { subscribe } from '../../../utils/reactivity'
import { assert } from '../../../utils/utils'
import { List } from './list'

export const INJECT_LIST = new InjectionToken<Observable<List<any>>>('List Token')

@Directive({
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
    const $list = inject(INJECT_LIST, { self: true })
    assert($list)

    subscribe(this, $list, list => {
      if (!list) return

      this.list = list

      registerCommands(list, this.commands)

      subscribe(this, list.selectedItem, selectedItem => {
        this.selectedItem = selectedItem.value
      })
    })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
