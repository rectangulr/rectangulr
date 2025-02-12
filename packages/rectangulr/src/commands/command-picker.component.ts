import { Component, inject, input, output, viewChild } from '@angular/core'
import { last } from '@s-libs/micro-dash'
import { Subject } from 'rxjs'
import { addStyle } from '../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'
import { LOGGER } from '../angular-terminal/logger'
import { Style } from '../components/1-basics/style'
import { V } from '../components/1-basics/v'
import { ListItem } from '../components/2-common/list/list-item'
import { SearchList } from '../components/2-common/search-list'
import { assert } from '../utils/Assert'
import { signal2 } from '../utils/Signal2'
import { logError } from '../utils/utils'
import { Disposable } from './disposable'
import { Command, ShortcutService } from './shortcut.service'

/**
 * Popup to discover commands and pick one.
 */
@Component({
  selector: 'command-picker',
  template: `
    <search-list
      #searchList
      [items]="listOfCommands()"
      [s]="{ border: 'rounded', backgroundColor: 'darkgray', hgrow: true }">
      <v *item="let command; type: listOfCommands"
        >{{ command.name }} ({{ command.keys }})
      </v>
    </search-list>
  `,
  providers: [
    {
      // This creates a ShortcutService to store separately the shortcuts of this component.
      provide: ShortcutService,
    },
  ],
  imports: [SearchList, ListItem, Style, V]
})
export class CommandPicker {
  readonly shortcutService = input<ShortcutService>(null)
  readonly onClose = output()

  isolatedShortcutService = inject(ShortcutService)
  logger = inject(LOGGER)

  readonly listOfCommands = signal2<Command[]>([])
  readonly hideCommands = signal2(true)
  readonly list = viewChild<SearchList<any>>('searchList')

  constructor() {
    // Isolate the isolatedShortcutService
    this.isolatedShortcutService.parent = undefined
    addStyle({ position: 'absolute', top: 0, left: '25%', width: '50%', maxHeight: '100%' })
  }

  ngOnInit() {
    this.hideCommands.subscribe(hideCommands => {
      this.listOfCommands.$ = this.listCommands()
    })
    this.shortcutService().rootNode().before.$ = this.isolatedShortcutService

    // almost like: registerShortcuts(this.commands)
    const disposables = this.shortcuts.map(command => {
      return this.isolatedShortcutService.registerCommand({ ...command, context: { name: 'Shortcuts', ref: this } })
    })

    this.destroy$.subscribe(() => {
      Disposable.from(...disposables).dispose()
    })
  }

  private listCommands(): Command[] {
    function recursiveListCommands(shortcutService: ShortcutService, result: Array<Command>) {
      const commands = Object.values(shortcutService.commands())
        .map(commands => last(commands))
        .filter(c => c)
      result.push(...commands)
      if (shortcutService.parent) {
        recursiveListCommands(shortcutService.parent, result)
      }
    }

    let commands: Array<Command> = []
    const focused = focusedShortcutService(this.shortcutService())
    recursiveListCommands(focused, commands)
    if (this.hideCommands()) {
      return commands.filter(c => !c.hidden)
    } else {
      return commands
    }
  }

  shortcuts = [
    {
      keys: 'enter',
      func: () => {
        let command = this.list().selectedItem.value
        if (!command) return
        const focused = focusedShortcutService(this.shortcutService())
        try {
          focused.callCommand({ id: command.id })
        } catch (e) {
          logError(this.logger, `callCommand failed: '${command.id}'\n${e}`)
        }
        this.onClose.emit(null)
        this.shortcutService().before.$ = null
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
        this.hideCommands.$ = !this.hideCommands.$
      },
    },
    {
      keys: 'else',
      func: () => { },
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
    if (shortcutService.focusedChild() == null) {
      return shortcutService
    } else {
      shortcutService = shortcutService.focusedChild()
    }
    assert(i < 100, 'infinite loop ?')
  }
}
