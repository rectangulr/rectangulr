import { Component, SkipSelf } from '@angular/core'
import { Subject } from 'rxjs'
import { Logger } from '../../../angular-terminal/logger'
import { forceRefresh, subscribe } from '../../../utils/reactivity'
import { Box } from '../../1-basics/box'
import { ClassesDirective } from '../../1-basics/classes'
import { List } from '../list/list'
import { blackOnWhite } from '../styles'

class NullLogger {
  log(thing) {}
}

@Component({
  selector: 'logs-view',
  standalone: true,
  imports: [Box, List, ClassesDirective],
  host: { '[style]': "{height: '100%'}" },
  template: `
    <box [classes]="[blackOnWhite]">Logs</box>
    <list [items]="logs"></list>
  `,
  providers: [{ provide: Logger, useClass: NullLogger }],
})
export class Logs {
  logs = null

  constructor(@SkipSelf() public logger: Logger) {
    subscribe(this, this.logger.$logs, logs => {
      // Update the logs asynchronously, because if something gets logged
      // after change detection, it would throw an error
      setTimeout(() => {
        this.logs = [...logs]
        forceRefresh()
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
