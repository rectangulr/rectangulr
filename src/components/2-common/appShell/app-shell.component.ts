import { Component, Inject } from '@angular/core'
import { Subject } from 'rxjs'
import { makeRuleset } from '../../../angular-terminal/dom-terminal'
import { Logger } from '../../../angular-terminal/logger'
import { Command, CommandService, registerCommands } from '../../../commands/command_service'
import { makeProperty } from '../../../utils/reactivity'
import { whiteOnGray } from '../styles'
import { View, ViewService } from './view.service'

@Component({
  selector: 'app-shell',
  host: { '[style]': "{width: '100%', height: '100%'}" },
  template: `
    <!-- Display the currentView. The others are styled 'display: none'. -->
    <box
      *ngFor="let view of viewService.views"
      focus
      [focusFromChildren]="false"
      [focusIf]="view == currentView"
      [style]="{ display: view == currentView ? 'flex' : 'none' }">
      <ng-container [ngComponentOutlet]="view.component"></ng-container>
    </box>

    <!-- Push the bottom-bar to the bottom. -->
    <box [style]="{ flexGrow: 1 }"></box>

    <!-- Bottom bar. List of tabs. -->
    <box [style]="{ flexDirection: 'row', flexShrink: 0 }">
      <box
        *ngFor="let view of viewService.views"
        [classes]="[nullOnNull, [whiteOnGray, view == currentView]]"
        [style]="{ paddingLeft: 1, paddingRight: 1 }"
        >{{ view.name }}</box
      >
      <box [style]="{ flexGrow: 1 }"></box>
      <box [style]="{ flexShrink: 0 }">Help: alt+p</box>
    </box>

    <!-- Popup to discover shortcuts -->
    <commands
      *ngIf="showCommands"
      [commandService]="commandService"
      (onClose)="showCommands = false">
    </commands>

    <!-- Popup to show notifications -->
    <notifications></notifications>
  `,
})
export class AppShell {
  currentView: View = null
  showCommands: boolean = false

  constructor(
    @Inject(ViewService) public viewService: ViewService,
    public commandService: CommandService,
    public logger: Logger
  ) {
    makeProperty(this, this.viewService.$currentView, 'currentView')
    registerCommands(this, this.commands)
  }

  // ngAfterViewInit() {
  //   this.focusEmitters.get(this.currentView).next(null)
  // }

  whiteOnGray = whiteOnGray
  nullOnNull = makeRuleset({ backgroundColor: null, color: null })

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
      id: 'throwError',
      func: () => {
        this.logger.log({ level: 'error', message: 'test notification error' })
      },
    },
    {
      keys: 'alt+shift+l',
      id: 'showLogs',
      keywords: 'errors',
      func: () => {
        this.viewService.switchTo('logs')
      },
    },
  ]

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
