import { Component } from '@angular/core'
import { Logger } from '../../../angular-terminal/logger'
import { blackOnWhite } from '../styles'

@Component({
  selector: 'logs-view',
  template: `
    <box [classes]="[blackOnWhite]">Logs</box>
    <table [items]="logger.$logs">
      <!-- <box *listItem="let item">{{ item | json5 }}</box> -->
    </table>
  `,
})
export class Logs {
  constructor(public logger: Logger) {}

  blackOnWhite = blackOnWhite
}
