import { Directive, EventEmitter, Output } from '@angular/core'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { registerCommands } from '../../../commands/command-service'
import { List } from './list'

@Directive({
  selector: '[onEnter]',
})
export class OnEnterDirective {
  @Output() onEnter = new EventEmitter()

  selectedItem = null

  commands = [
    {
      keys: 'enter',
      func: () => {
        this.onEnter.emit(this.selectedItem)
      },
    },
  ]

  constructor(private list: List<any>) {
    registerCommands(list, this.commands)

    this.list.selectedItem.pipe(takeUntil(this.destroy$)).subscribe(selectedItem => {
      this.selectedItem = selectedItem.value
    })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
