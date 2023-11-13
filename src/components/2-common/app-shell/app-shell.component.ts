import { NgComponentOutlet, NgFor, NgIf } from '@angular/common'
import { Component } from '@angular/core'
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

@Component({
  standalone: true,
  selector: 'app-shell',
  hostDirectives: [GrowDirective],
  template: `
    <!-- Display the currentTab. The others are styled 'display: none'. -->
    <v
      *ngFor="let view of viewService.views()"
      [focusPropagateUp]="false"
      [focusIf]="view == this.viewService.currentTab()"
      grow
      [s]="[cond(neq(view, this.viewService.currentTab), {display: 'none'})]">
      <ng-container [ngComponentOutlet]="view.component"/>
    </v>

    <!-- Push the bottom-bar to the bottom. -->
    <h [s]="{ vgrow: true }"/>

    <!-- Bottom bar. List of visible views. -->
    <h [s]="{ hgrow: true, backgroundColor: 'grey' }">
      <h
        *ngFor="let view of viewService.visibleViews()"
        [s]="[{ paddingLeft: 1, paddingRight: 1, flexShrink: 0 }, cond(eq(view, this.viewService.currentTab), s.blackOnWhite)]"
        (mousedown)="viewService.switchTo(view.name)"
        >{{ view.name }}</h
      >
      <h [s]="{ hgrow: true }"/>
      <h [s]="{ flexShrink: 0 }">Help: alt+p</h>
    </h>

    <!-- Popup to discover shortcuts -->
    <shortcuts *ngIf="showCommands" [shortcutService]="shortcutService" (onClose)="showCommands = false"/>

    <!-- Popup to show notifications -->
    <notifications/>
  `,
  imports: [HBox, VBox, NgIf, NgFor, FocusDirective, NgComponentOutlet, Notifications, Shortcuts, GrowDirective, StyleDirective],
})
export class AppShell {
  showCommands = false

  constructor(
    public viewService: ViewService,
    public shortcutService: ShortcutService,
    public logger: Logger
  ) {
    registerShortcuts(this, this.shortcuts)
    this.viewService.currentTab
  }

  s = {
    blackOnWhite: blackOnWhite,
    whiteOnGray: whiteOnGray,
  }

  cond = cond
  eq = eq
  neq = neq

  shortcuts: Partial<Command>[] = [
    {
      keys: 'alt+p',
      id: 'toggleCommands',
      keywords: 'commands shortcuts help',
      func: () => {
        this.showCommands = !this.showCommands
      },
    },
    {
      keys: 'alt+o',
      id: 'nextTab',
      keywords: 'next view',
      func: () => {
        this.viewService.nextView()
      },
    },
    {
      keys: 'escape',
      func: () => {
        if (this.showCommands) {
          this.showCommands = false
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

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
