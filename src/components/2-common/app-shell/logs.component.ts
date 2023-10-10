import { Component, SkipSelf, inject } from '@angular/core'
import { Logger } from '../../../angular-terminal/logger'
import { HBox } from '../../1-basics/box'
import { NewClassesDirective } from '../../1-basics/classes'
import { List } from '../list/list'
import { ListItem } from '../list/list-item'

class NullLogger {
  log(thing) { }
}

@Component({
  selector: 'logs-view',
  standalone: true,
  imports: [HBox, List, ListItem, NewClassesDirective],
  host: { '[style]': "{height: '100%', width: '100%'}" },
  template: `
    <h [newclasses]="[blackOnWhite, { hgrow: true }]">Logs</h>
    <list [items]="logs"></list>
  `,
  // providers: [{ provide: Logger, useClass: NullLogger }],
})
export class Logs {
  logs = this.logger.$logs()

  constructor(@SkipSelf() public logger: Logger) { }

  blackOnWhite = { backgroundColor: 'white', color: 'black' }
}
