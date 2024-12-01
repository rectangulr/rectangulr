import { NgComponentOutlet } from '@angular/common'
import { Component, inject } from '@angular/core'
import { Subject } from 'rxjs'
import { cond, eq, neq } from '../../../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'
import { Logger } from '../../../angular-terminal/logger'
import { FocusDirective } from '../../../commands/focus.directive'
import { Command, ShortcutService, registerShortcuts } from '../../../commands/shortcut.service'
import { Shortcuts } from '../../../commands/shortcuts.component'
import { GrowDirective, HBox, VBox } from '../../1-basics/box'
import { StyleDirective } from '../../1-basics/style'
import { blackOnWhite, whiteOnGray } from '../styles'
import { Notifications } from './notifications.component'
import { ViewService } from './view.service'
import { signal2 } from '../../../utils/Signal2'

@Component({
  standalone: true,
  selector: 'app-shell',
  hostDirectives: [GrowDirective],
  host: { 's': '{width: "100%", height: "100%"}' },
  template: `
    <!-- Display the currentTab. The others are styled 'display: none'. -->
    @for (view of viewService.views(); track view) {
      <v
        [focusPropagateUp]="false"
        [focusIf]="view == this.viewService.currentTab()"
        grow
        [s]="[cond(neq(view, this.viewService.currentTab), {display: 'none'})]">
        <ng-container [ngComponentOutlet]="view.component"/>
      </v>
    }

    <!-- Push the bottom-bar to the bottom. -->
    <h [s]="{ vgrow: true }"/>

    <!-- Bottom bar. List of visible views. -->
    <h [s]="{ hgrow: true, backgroundColor: 'grey' }">
      @for (view of viewService.visibleViews(); track view) {
        <h
          [s]="[{ paddingLeft: 1, paddingRight: 1, flexShrink: 0 }, cond(eq(view, this.viewService.currentTab), s.blackOnWhite)]"
          (mousedown)="viewService.switchTo(view.name)"
          >{{ view.name }}
        </h>
      }
      <h [s]="{ hgrow: true }"/>
      <h [s]="{ flexShrink: 0 }" (mousedown)="toggleCommands()">Help: alt+p</h>
    </h>

    <!-- Popup to discover shortcuts -->
    @if (showCommands()) {
      <shortcuts [shortcutService]="shortcutService" (onClose)="showCommands.$ = false"/>
    }

    <!-- Popup to show notifications -->
    <notifications/>
  `,
  imports: [HBox, VBox, FocusDirective, NgComponentOutlet, Notifications, Shortcuts, GrowDirective, StyleDirective],
})
export class AppShell {
  showCommands = signal2(false)
  viewService = inject(ViewService)
  shortcutService = inject(ShortcutService)
  logger = inject(Logger)

  constructor() {
    registerShortcuts(this.shortcuts)
  }

  s = {
    blackOnWhite: blackOnWhite,
    whiteOnGray: whiteOnGray,
  }

  cond = cond
  eq = eq
  neq = neq

  toggleCommands() {
    this.showCommands.$ = !this.showCommands.$
  }

  shortcuts: Partial<Command>[] = [
    {
      keys: 'alt+p',
      id: 'toggleCommands',
      keywords: 'commands shortcuts help',
      func: () => this.toggleCommands(),
    },
    {
      keys: 'alt+e',
      id: 'nextTab',
      keywords: 'next view',
      func: () => {
        this.viewService.nextView()
      },
    },
    {
      keys: 'escape',
      func: () => {
        if (this.showCommands.$) {
          this.showCommands.$ = false
        }
      },
    },
    {
      keys: 'alt+shift+l',
      id: 'showLogs',
      keywords: 'errors',
      func: () => {
        this.viewService.switchTo('Logs')
      },
    },
    {
      keys: 'alt+shift+d',
      id: 'showDebugger',
      keywords: 'inspector',
      func: () => {
        this.viewService.switchTo('Debugger')
      },
    },
  ]
}
