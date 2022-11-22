import { Component, inject, Inject } from '@angular/core'
import { ReplaySubject, Subject } from 'rxjs'
import { makeRuleset } from '../../../angular-terminal/dom-terminal'
import { Logger } from '../../../angular-terminal/logger'
import { Command, CommandService, registerCommands } from '../../../commands/command_service'
import { subscribe } from '../../../utils/reactivity'
import { whiteOnGray } from '../styles'
import { NotificationsService } from './notifications.service'
import { View, ViewService } from './view.service'

@Component({
  selector: 'app-shell',
  host: { '[style]': "{width: '100%', height: '100%'}" },
  template: `
    <!-- Display the currentView. The others are styled 'display: none'. -->
    <box
      *ngFor="let view of viewService.views"
      [focusSeparate]="focusEmitters.get(view)"
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
  providers: [
    {
      provide: Logger,
      useFactory: () => {
        const logger = inject(Logger, { skipSelf: true })
        const notificationsService = inject(NotificationsService)
        return {
          log: thing => {
            logger.log(thing)
            if (thing.level == 'error') {
              notificationsService.notify({ name: 'An error occured', ...thing })
            }
          },
        }
      },
    },
  ],
})
export class AppShell {
  currentView: View = null
  focusEmitters: Map<View, Subject<null>> = null
  showCommands: boolean = false

  constructor(
    @Inject(ViewService) public viewService: ViewService,
    public commandService: CommandService,
    public logger: Logger
  ) {
    this.focusEmitters = new Map()
    this.viewService.views.forEach(view => {
      this.focusEmitters.set(view, new ReplaySubject(1))
    })
    subscribe(this, this.viewService.$currentView, currentView => {
      this.currentView = currentView
      this.focusEmitters.get(currentView).next(null)
    })

    registerCommands(this, this.commands)
  }

  ngAfterViewInit() {
    this.focusEmitters.get(this.currentView).next(null)
  }

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
      keys: 'alt+l',
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
