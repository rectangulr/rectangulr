import { Component, SkipSelf, signal } from '@angular/core'
import { Subject } from 'rxjs'
import { Logger } from '../../../angular-terminal/logger'
import { FocusDirective, ShortcutService, registerShortcuts } from '../../../public-api'
import { GrowDirective, HBox, VBox } from '../../1-basics/box'
import { StyleDirective } from '../../1-basics/style'
import { Json5Pipe } from '../json5.pipe'
import { List } from '../list/list'
import { ListItem } from '../list/list-item'
import { ObjectDisplay } from "../object-display"

class NullLogger {
  log(thing) { }
}

@Component({
  selector: 'logs',
  hostDirectives: [GrowDirective],
  template: `
    <h [s]="[s.blackOnWhite, { hgrow: true }]">Logs</h>
    <h grow>
      <list [items]="logs" [s]="{ width: '50%' }" (selectedItem)="$selectedLog.set($event)">
        <div *item="let item">{{item | json5}}</div>
      </list>
      <v [focusIf]="focused == 'right'" [s]="[s.rightPane]">
        <object-display [object]="$selectedLog() || {}" />
      </v>
    </h>
  `,
  standalone: true,
  imports: [HBox, VBox, List, ListItem, StyleDirective, Json5Pipe, ObjectDisplay, FocusDirective, GrowDirective]
})
export class Logs {
  logs = this.logger.$logs
  $selectedLog = signal(null)
  focused: 'left' | 'right' = 'left'

  constructor(@SkipSelf() public logger: Logger, public shortcutService: ShortcutService) {
    registerShortcuts(this, this.shortcuts)
  }

  shortcuts = [
    {
      keys: 'shift+right',
      func: key => {
        if (this.focused == 'left') {
          this.focused = 'right'
        } else {
          return key
        }
      }
    },
    {
      keys: 'shift+left',
      func: key => {
        if (this.focused == 'right') {
          this.focused = 'left'
        } else {
          return key
        }
      }
    }
  ]

  s = {
    rightPane: { width: '50%', height: '100%', flexShrink: 0, borderLeftCharacter: '|' },
    blackOnWhite: { backgroundColor: 'white', color: 'black' }
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
