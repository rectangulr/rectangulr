import { Component, ViewChild } from '@angular/core'
import { Subject } from 'rxjs'
import { map } from 'rxjs/internal/operators/map'
import { KeybindService, registerKeybinds } from '../reusable/keybind-service'
import { SearchList } from '../reusable/search-list'
import { CommandsService } from './command-service'

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
  providers: [KeybindService],
})
export class CommandsDisplay {
  commands = this.commandsService.commands.$.pipe(map(commands => Object.keys(commands)))

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
        this.commandsService.executeCommand({ id: commandId })
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

  constructor(public commandsService: CommandsService, public keybindService: KeybindService) {}

  ngOnInit() {
    this.keybindService.rootNode.before = this.keybindService

    registerKeybinds(this, this.globalKeybinds)
  }

  setVisible(visible) {
    this.visible = visible

    if (visible) {
      this.keybinds.forEach(k => {
        this.keybindService.register(k)
      })
    } else {
      this.keybinds.forEach(k => {
        this.keybindService.remove(k)
      })
      this.keybindService.unfocus()
    }
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
