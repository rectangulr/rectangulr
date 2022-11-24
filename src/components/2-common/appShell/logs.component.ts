import { Component } from '@angular/core'
import { Subject } from 'rxjs'
import { Logger } from '../../../angular-terminal/logger'
import { subscribe } from '../../../utils/reactivity'
import { blackOnWhite } from '../styles'

@Component({
  selector: 'logs-view',
  template: `
    <box [classes]="[blackOnWhite]">Logs</box>
    <list [items]="logger.$logs">
      <box *listItem="let item">{{ item | json5 }}</box>
    </list>
  `,
})
export class Logs {
  logs = []

  constructor(public logger: Logger) {
    // subscribe(this, this.logger.$logs, logs => {
    //   setTimeout(() => {
    //     this.logs = logs
    //   }, 0)
    // })
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  blackOnWhite = blackOnWhite
}
