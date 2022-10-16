import { Component, ViewChild } from '@angular/core'
import { Subject } from 'rxjs'
import { map } from 'rxjs/internal/operators/map'
import { CommandService, registerCommands } from '../commands/command-service'
import { SearchList } from '../components/2-common/search_list'

@Component({
  selector: 'commands',
  template: `
    <search-list
      *ngIf="visible"
      #searchList
      [items]="commands"
      [style]="{ border: 'modern', backgroundColor: 'darkgray' }">
    </search-list>
  `,
  providers: [CommandService],
})
export class CommandsDisplay {
  commands = this.commandService.commandsChange.pipe(map(commands => Object.keys(commands)))

  visible = false

  globalKeybinds = [
    {
      keys: 'alt+p',
      id: 'showCommands',
      func: () => {
        this.setVisible(true)
      },
    },
  ]

  keybinds = [
    {
      keys: 'enter',
      func: () => {
        let commandId = this.list.selectedItem.value.value
        this.commandService.callCommand({ id: commandId })
        this.setVisible(false)
      },
    },
    {
      keys: 'escape',
      func: () => {
        this.setVisible(false)
      },
    },
  ]

  @ViewChild('searchList') list: SearchList

  constructor(public commandService: CommandService) {}

  ngOnInit() {
    this.commandService.rootNode.before = this.commandService

    registerCommands(this, this.globalKeybinds)
  }

  setVisible(visible) {
    this.visible = visible

    if (visible) {
      this.keybinds.forEach(k => {
        // this.commandService.registerCommand(k)
      })
    } else {
      this.keybinds.forEach(k => {
        // this.commandService.removeCommand(k)
      })
      this.commandService.unfocus()
    }
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
