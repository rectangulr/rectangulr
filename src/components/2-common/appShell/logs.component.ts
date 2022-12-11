import { Component } from '@angular/core'
import { Subject } from 'rxjs'
import { Logger } from '../../../angular-terminal/logger'
import { forceRefresh, subscribe } from '../../../utils/reactivity'
import { async } from '../../../utils/utils'
import { blackOnWhite } from '../styles'

@Component({
  selector: 'logs-view',
  template: `
    <box [classes]="[blackOnWhite]">Logs</box>
    <list [items]="logs"></list>
  `,
})
export class Logs {
  logs = []

  constructor(public logger: Logger) {
    subscribe(this, this.logger.$logs, logs => {
      // Update the logs asynchronously, because if something gets logged
      // after change detection, it would throw an error
      this.logs = [...logs]
      // async(() => {
      //   forceRefresh()
      // }
    })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  blackOnWhite = blackOnWhite
}
