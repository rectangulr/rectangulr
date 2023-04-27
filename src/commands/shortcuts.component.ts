import { Component, EventEmitter, inject, Input, NgZone, Output, ViewChild } from '@angular/core'
import * as _ from 'lodash'
import { Subject } from 'rxjs'
import { Logger } from '../angular-terminal/logger'
import { VBox } from '../components/1-basics/box'
import { StyleDirective } from '../components/1-basics/style'
import { ListItem } from '../components/2-common/list/list-item'
import { SearchList } from '../components/2-common/search-list'
import { onChange } from '../utils/reactivity'
import { assert } from '../utils/utils'
import { Disposable } from './disposable'
import { Command, ShortcutService } from './shortcut.service'

/**
 * Popup to discover shortcuts.
 */
@Component({
  standalone: true,
  imports: [VBox, SearchList, ListItem, StyleDirective],
  selector: 'shortcuts',
  host: { '[style]': "{ position: 'absolute', top: 0, left: '25%', width: '50%' }" },
  template: `
    <search-list
      #searchList
      [items]="listOfCommands"
      [style]="{ border: 'rounded', backgroundColor: 'darkgray', hgrow: true }">
      <vbox *item="let command; type: listOfCommands"
        >{{ command.name }} ({{ command.keys }})
      </vbox>
    </search-list>
  `,
  providers: [
    {
      // The shortcuts of this component must be stored separately
      provide: ShortcutService,
      useFactory: () => {
        return new ShortcutService(null, inject(Logger), null, inject(NgZone))
      },
    },
  ],
})
export class Shortcuts {
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

    // almost like: registerShortcuts(this, this.commands)
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
