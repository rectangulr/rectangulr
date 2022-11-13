import { Component, Inject } from '@angular/core'
import { ReplaySubject, Subject } from 'rxjs'
import { makeRuleset } from '../../../angular-terminal/dom-terminal'
import { Command, CommandService, registerCommands } from '../../../commands/command_service'
import { subscribe } from '../../../utils/reactivity'
import { whiteOnGray } from '../styles'
import { View, ViewService } from './view.service'

@Component({
  selector: 'app-shell',
  host: { '[style]': "{width: '100%', height: '100%'}" },
  template: `
    <!-- All views. Only the currentView is displayed. -->
    <box
      *ngFor="let view of viewService.views"
      [focusSeparate]="focusEmitters.get(view)"
      [style]="{ display: view == currentView ? 'flex' : 'none' }">
      <ng-container [ngComponentOutlet]="view.component"></ng-container>
    </box>

    <!-- Push the bar at the bottom. -->
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
      (onClose)="onCommandsClose()"
      [style]="{ position: 'fixed', top: 0, left: '25%', width: '50%' }">
    </commands>
  `,
})
export class AppShell {
  currentView: View = null
  focusEmitters: Map<View, Subject<null>> = null
  showCommands: boolean = false

  commands: Partial<Command>[] = [
    {
      keys: 'alt+p',
      name: 'Toggle commands',
      keywords: 'commands shortcuts help',
      func: () => {
        this.showCommands = !this.showCommands
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
  ]

  constructor(
    @Inject(ViewService) public viewService: ViewService,
    public commandService: CommandService
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

  onCommandsClose() {
    this.showCommands = false
    this.commandService.before = null
  }

  whiteOnGray = whiteOnGray
  nullOnNull = makeRuleset({ backgroundColor: null, color: null })

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}