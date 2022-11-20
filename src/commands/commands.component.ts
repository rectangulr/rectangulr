import { Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core'
import * as _ from 'lodash'
import { Subject } from 'rxjs'
import { Logger } from '../angular-terminal/logger'
import { SearchList } from '../components/2-common/search_list'
import { onChange } from '../utils/reactivity'
import { assert } from '../utils/utils'
import { Command, CommandService } from './command_service'
import { Disposable } from './disposable'

@Component({
  selector: 'commands',
  host: { '[style]': "{ position: 'fixed', top: 0, left: '25%', width: '50%' }" },
  template: `
    <search-list
      #searchList
      [items]="listOfCommands"
      [style]="{ border: 'modern', backgroundColor: 'darkgray' }">
      <box *listItem="let command; type: listOfCommands"
        >{{ command.name }} ({{ command.keys }})
      </box>
    </search-list>
  `,
  providers: [
    {
      provide: CommandService,
      useFactory: () => {
        const logger = inject(Logger)
        const commandService = new CommandService(null, logger, null)
        return commandService
      },
    },
  ],
})
export class CommandsDisplay {
  @Input() commandService: CommandService = null
  @Output() onClose = new EventEmitter()

  listOfCommands: Command[] = []
  hideCommands = true
  @ViewChild('searchList') list: SearchList<any>

  constructor(public isolatedCommandService: CommandService) {
    onChange(this, 'hideCommands', hideCommands => {
      this.listOfCommands = this.listCommands()
    })
  }

  commands = [
    {
      keys: 'enter',
      func: () => {
        let command = this.list.selectedItem.value
        if (!command) return
        const focused = focusedCommandService(this.commandService)
        focused.callCommand({ id: command.id })
        this.onClose.emit(null)
        this.commandService.before = null
      },
    },
    {
      keys: 'escape',
      func: () => {
        this.onClose.emit(null)
      },
    },
    {
      keys: 'ctrl+h',
      name: 'Toggle Hidden Commands',
      func: () => {
        this.hideCommands = !this.hideCommands
      },
    },
  ]

  ngOnInit() {
    this.listOfCommands = this.listCommands()
    this.commandService.rootNode.before = this.isolatedCommandService

    // almost like: registerCommands(this, this.commands)
    const disposables = this.commands.map(command => {
      return this.isolatedCommandService.registerCommand({ ...command, context: this })
    })

    this.destroy$.subscribe(() => {
      Disposable.from(...disposables).dispose()
    })
  }

  private listCommands(): Command[] {
    function recursiveListCommands(commandService: CommandService, result: Array<Command>) {
      const commands = Object.values(commandService.commands)
        .map(commands => _.last(commands))
        .filter(c => c)
      result.push(...commands)
      if (commandService.parent) {
        recursiveListCommands(commandService.parent, result)
      }
    }

    let commands: Array<Command> = []
    const focused = focusedCommandService(this.commandService)
    recursiveListCommands(focused, commands)
    if (this.hideCommands) {
      return commands.filter(c => !c.hidden)
    } else {
      return commands
    }
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}

function focusedCommandService(rootCommandService: CommandService) {
  let commandService = rootCommandService
  let i = 0
  while (true) {
    if (commandService.focusedChild == null) {
      return commandService
    } else {
      commandService = commandService.focusedChild
    }
    assert(i < 100)
  }
}
