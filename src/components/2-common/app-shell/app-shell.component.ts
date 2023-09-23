import { NgComponentOutlet, NgFor, NgIf } from '@angular/common'
import { Component, Inject } from '@angular/core'
import { Subject } from 'rxjs'
import { makeRuleset } from '../../../angular-terminal/dom-terminal'
import { Logger } from '../../../angular-terminal/logger'
import { FocusDirective } from '../../../commands/focus.directive'
import { Command, registerShortcuts, ShortcutService } from '../../../commands/shortcut.service'
import { Shortcuts } from '../../../commands/shortcuts.component'
import { makeProperty } from '../../../utils/reactivity'
import { HBox, GrowDirective, VBox } from '../../1-basics/box'
import { ClassesDirective } from '../../1-basics/classes'
import { blackOnWhite, whiteOnGray } from '../styles'
import { Notifications } from './notifications.component'
import { View, ViewService } from './view.service'
import { StyleDirective } from '../../1-basics/style'

@Component({
  standalone: true,
  selector: 'app-shell',
  host: { '[style]': "{width: '100%', height: '100%'}" },
  template: `
    <!-- Display the currentTab. The others are styled 'display: none'. -->
    <vbox
      *ngFor="let view of viewService.views()"
      [focusPropagateUp]="false"
      [focusIf]="view == this.viewService.currentTab()"
      [style]="{ display: view == this.viewService.currentTab() ? 'flex' : 'none', width: '100%', height: '100%' }">
      <ng-container [ngComponentOutlet]="view.component"/>
    </vbox>

    <!-- Push the bottom-bar to the bottom. -->
    <hbox [style]="{ vgrow: true }"/>

    <!-- Bottom bar. List of visible views. -->
    <hbox [style]="{ hgrow: true, backgroundColor: 'grey' }">
      <hbox
        *ngFor="let view of viewService.visibleViews()"
        [classes]="[[view == this.viewService.currentTab(), s.blackOnWhite]]"
        [style]="{ paddingLeft: 1, paddingRight: 1 }"
        >{{ view.name }}</hbox
      >
      <hbox [style]="{ hgrow: true }"/>
      <hbox [style]="{ flexShrink: 0 }">Help: alt+p</hbox>
    </hbox>

    <!-- Popup to discover shortcuts -->
    <shortcuts *ngIf="showCommands" [shortcutService]="shortcutService" (onClose)="showCommands = false"/>

    <!-- Popup to show notifications -->
    <notifications/>
  `,
  imports: [HBox, VBox, NgIf, NgFor, ClassesDirective, FocusDirective, NgComponentOutlet, Notifications, Shortcuts, GrowDirective, StyleDirective],
})
export class AppShell {
  showCommands = false

  constructor(
    @Inject(ViewService) public viewService: ViewService,
    public shortcutService: ShortcutService,
    public logger: Logger
  ) {
    registerShortcuts(this, this.commands)
  }

  s = {
    blackOnWhite: blackOnWhite,
    whiteOnGray: whiteOnGray,
    nullOnNull: makeRuleset({ backgroundColor: null, color: null }),
  }

  commands: Partial<Command>[] = [
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
