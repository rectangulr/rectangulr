import { Component, SkipSelf } from '@angular/core'
import { Logger } from '../../../angular-terminal/logger'
import { HBox } from '../../1-basics/box'
import { StyleDirective } from '../../1-basics/style'
import { List } from '../list/list'
import { ListItem } from '../list/list-item'
import { addStyle } from '../../../public-api'

class NullLogger {
  log(thing) { }
}

@Component({
  selector: 'logs-view',
  template: `
    <h [s]="[blackOnWhite, { hgrow: true }]">Logs</h>
    <list [items]="logs"></list>
  `,
  standalone: true,
  imports: [HBox, List, ListItem, StyleDirective],
  // providers: [{ provide: Logger, useClass: NullLogger }],
})
export class Logs {
  logs = this.logger.$logs()

  constructor(@SkipSelf() public logger: Logger) {
    addStyle({ height: '100%', width: '100%' })
  }

  blackOnWhite = { backgroundColor: 'white', color: 'black' }
}
