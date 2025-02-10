import { NgComponentOutlet } from '@angular/common'
import { Component, inject } from '@angular/core'
import { GrowDirective } from '../../../components/1-basics/grow.directive'
import { H } from '../../../components/1-basics/h'
import { V } from '../../../components/1-basics/v'
import { cond, eq, neq } from '../../../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'
import { CommandPicker } from '../../../commands/command-picker.component'
import { FocusDirective } from '../../../commands/focus.directive'
import { Command, ShortcutService, registerShortcuts } from '../../../commands/shortcut.service'
import { signal2 } from '../../../utils/Signal2'
import { StyleDirective } from '../../1-basics/style'
import { blackOnWhite, whiteOnGray } from '../styles'
import { Notifications } from './notifications.component'
import { ViewService } from './view.service'

@Component({
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
        [s]="[cond(neq(view, this.viewService.currentTab), {display: 'none', flexShrink: 1})]">
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

    <!-- Popup to discover commands -->
    @if (showCommands()) {
      <command-picker [shortcutService]="shortcutService" (onClose)="showCommands.$ = false"/>
    }

    <!-- Popup to show notifications -->
    <notifications [focusOnInit]="false"/>
  `,
  imports: [H, V, FocusDirective, NgComponentOutlet, Notifications, CommandPicker, GrowDirective, StyleDirective]
})
export class AppShell {
  readonly showCommands = signal2(false)

  readonly viewService = inject(ViewService)
  readonly shortcutService = inject(ShortcutService)

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
