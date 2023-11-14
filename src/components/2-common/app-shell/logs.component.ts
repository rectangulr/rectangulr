import { ChangeDetectionStrategy, Component, SkipSelf } from '@angular/core'
import { Logger } from '../../../angular-terminal/logger'
import { GrowDirective, HBox } from '../../1-basics/box'
import { StyleDirective } from '../../1-basics/style'
import { List } from '../list/list'
import { ListItem } from '../list/list-item'
import { Json5Pipe } from '../json5.pipe'

class NullLogger {
  log(thing) { }
}

@Component({
  selector: 'logs-view',
  template: `
    <h [s]="[blackOnWhite, { hgrow: true }]">Logs</h>
    <list [items]="logs">
      <div *item="let item">{{item | json5}}</div>
    </list>
  `,
  standalone: true,
  hostDirectives: [GrowDirective],
  imports: [HBox, List, ListItem, StyleDirective, Json5Pipe],
  // providers: [{ provide: Logger, useClass: NullLogger }],
})
export class Logs {
  logs = this.logger.$logs

  constructor(@SkipSelf() public logger: Logger) { }

  blackOnWhite = { backgroundColor: 'white', color: 'black' }
}
