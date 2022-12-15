import { Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core'
import * as _ from 'lodash'
import { Subject } from 'rxjs'
import { Logger } from '../angular-terminal/logger'
import { SearchList } from '../components/2-common/search_list'
import { onChange } from '../utils/reactivity'
import { assert } from '../utils/utils'
import { Command, ShortcutService } from './shortcut.service'
import { Disposable } from './disposable'

/**
 * Popup to discover shortcuts.
 */
@Component({
  selector: 'commands',
  host: { '[style]': "{ position: 'absolute', top: 0, left: '25%', width: '50%' }" },
  template: `
    <search-list
      #searchList
      [items]="listOfCommands"
      [style]="{ border: 'rounded', backgroundColor: 'darkgray' }">
      <box *item="let command; type: listOfCommands">{{ command.name }} ({{ command.keys }}) </box>
    </search-list>
  `,
  providers: [
    {
      // The shortcuts of this component must be stored separately
      provide: ShortcutService,
      useFactory: () => {
        const logger = inject(Logger)
        const shortcutService = new ShortcutService(null, logger, null)
        return shortcutService
      },
    },
  ],
})
export class ShortcutsDisplay {
  @Input() shortcutService: ShortcutService = null
  @Output() onClose = new EventEmitter()

  listOfCommands: Command[] = []
  hideCommands = true
  @ViewChild('searchList') list: SearchList<any>

  constructor(public isolatedCommandService: ShortcutService) {
    onChange(this, 'hideCommands', hideCommands => {
      this.listOfCommands = this.listCommands()
    })
  }

  ngOnInit() {
    this.listOfCommands = this.listCommands()
    this.shortcutService.rootNode.before = this.isolatedCommandService

    // almost like: registerCommands(this, this.commands)
    const disposables = this.commands.map(command => {
      return this.isolatedCommandService.registerCommand({ ...command, context: this })
    })

    this.destroy$.subscribe(() => {
      Disposable.from(...disposables).dispose()
    })
  }

  private listCommands(): Command[] {
    function recursiveListCommands(shortcutService: ShortcutService, result: Array<Command>) {
      const commands = Object.values(shortcutService.commands)
        .map(commands => _.last(commands))
        .filter(c => c)
      result.push(...commands)
      if (shortcutService.parent) {
        recursiveListCommands(shortcutService.parent, result)
      }
    }

    let commands: Array<Command> = []
    const focused = focusedShortcutService(this.shortcutService)
    recursiveListCommands(focused, commands)
    if (this.hideCommands) {
      return commands.filter(c => !c.hidden)
    } else {
      return commands
    }
  }

  commands = [
    {
      keys: 'enter',
      func: () => {
        let command = this.list.selectedItem.value
        if (!command) return
        const focused = focusedShortcutService(this.shortcutService)
        focused.callCommand({ id: command.id })
        this.onClose.emit(null)
        this.shortcutService.before = null
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

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}

function focusedShortcutService(rootShortcutService: ShortcutService) {
  let shortcutService = rootShortcutService
  let i = 0
  while (true) {
    if (shortcutService.focusedChild == null) {
      return shortcutService
    } else {
      shortcutService = shortcutService.focusedChild
    }
    assert(i < 100, 'infinite loop ?')
  }
}
