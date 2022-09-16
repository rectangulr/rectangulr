import { Directive, Input } from '@angular/core'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { List, registerCommands } from '../public-api'

@Directive({
  selector: '[onEnter]',
})
export class OnEnterDirective {
  @Input() onEnter: any = null
  selectedItem = null
  commands = [
    {
      keys: 'enter',
      func: () => {
        this.onEnter(this.selectedItem)
      },
    },
  ]

  constructor(private list: List) {
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
