import { Component } from '@angular/core'
import { Subject } from 'rxjs'
import { Logger } from '../../../angular-terminal/logger'
import { subscribe } from '../../../utils/reactivity'
import { async } from '../../../utils/utils'
import { Box } from '../../1-basics/box'
import { NativeClassesDirective } from '../../1-basics/classes'
import { List } from '../list/list'
import { blackOnWhite } from '../styles'

@Component({
  standalone: true,
  imports: [Box, List, NativeClassesDirective],
  selector: 'logs-view',
  template: `
    <box [classes]="[blackOnWhite]">Logs</box>
    <list [items]="logs"></list>
  `,
})
export class Logs {
  logs = null

  constructor(public logger: Logger) {
    subscribe(this, this.logger.$logs, logs => {
      // Update the logs asynchronously, because if something gets logged
      // after change detection, it would throw an error
      async(() => {
        this.logs = [...logs]
      })
    })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  blackOnWhite = blackOnWhite
}
