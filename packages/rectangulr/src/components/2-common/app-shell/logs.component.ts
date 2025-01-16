import { Component, inject, signal } from '@angular/core'
import { Subject } from 'rxjs'
import { FileLogger } from '../../../angular-terminal/logger'
import { FocusDirective } from '../../../commands/focus.directive'
import { ShortcutService, registerShortcuts } from '../../../commands/shortcut.service'
import { signal2 } from '../../../utils/Signal2'
import { H } from '../../../components/1-basics/h'
import { V } from '../../../components/1-basics/v'
import { GrowDirective } from '../../../components/1-basics/grow.directive'
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
      <list [items]="logs()" [s]="{ width: '50%' }" (selectedItem)="$selectedLog.set($event)">
        <div *item="let item">{{item | json5}}</div>
      </list>
      <v [focusIf]="focused() == 'right'" [s]="[s.rightPane]">
        <object-display [object]="$selectedLog() || {}" />
      </v>
    </h>
  `,
  standalone: true,
  imports: [H, V, List, ListItem, StyleDirective, Json5Pipe, ObjectDisplay, FocusDirective, GrowDirective]
})
export class Logs {
  logger = inject(FileLogger, { skipSelf: true })
  shortcutService = inject(ShortcutService)

  logs = this.logger.$logs
  $selectedLog = signal(null)
  focused = signal2<'left' | 'right'>('left')

  constructor() {
    registerShortcuts(this.shortcuts)
  }

  shortcuts = [
    {
      keys: 'shift+right',
      func: key => {
        if (this.focused() == 'left') {
          this.focused.$ = 'right'
        } else {
          return key
        }
      }
    },
    {
      keys: 'shift+left',
      func: key => {
        if (this.focused() == 'right') {
          this.focused.$ = 'left'
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
