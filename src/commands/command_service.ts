import { EventEmitter, Injectable, Optional, SkipSelf } from '@angular/core'
import _ from 'lodash'
import { BehaviorSubject } from 'rxjs'
import { ComponentDebug } from '../angular-terminal/debug'
import { Element } from '../angular-terminal/dom-terminal'
import { Logger } from '../angular-terminal/logger'
import { Screen } from '../angular-terminal/screen-service'
import { Destroyable } from '../utils/mixins'
import { makeObservable, onChange } from '../utils/reactivity'
import {
  addToGlobal,
  assert,
  async,
  last,
  moveToLast,
  remove,
  removeLastMatch,
} from '../utils/utils'
import { Disposable } from './disposable'
import { Key } from './keypress-parser'

/**
 * Commands are a function with an `id`.
 * You can provide a default keybind with `keys`.
 */
export interface Command {
  id: string
  name: string
  keys: string | string[]
  func: (key: Key) => Key[] | void | Promise<Key[]> | Promise<void>
  context?: any
  keywords: string
  hidden: boolean
}

let globalId = 0

@Injectable({
  providedIn: 'root',
})
export class CommandService {
  _id = ++globalId

  /**
   * Commands are stored by `id`. An `id` can have multiple commands.
   * This allows components to declare the same `id` without conflict, the latest command is used.
   * When the second component is destroyed the first command can be restored.
   */
  commands: { [id: string]: Command[] } = {}
  $commands = new BehaviorSubject(null)

  /**
   * Links a key (ex: ctrl+r) with a command id (ex: reload)
   */
  keybinds: { [keys: string]: string[] } = {}

  focusStack: CommandService[] = []
  focusedChild: CommandService = null
  children: CommandService[] = []
  components = []
  rootNode: CommandService = null

  receivedFocusRequestRecently = false
  receivedCaretRequestRecently = false
  caretElement: Element = null

  isFocused = false
  $isFocused = new EventEmitter<boolean>()
  isInFocusPath = false
  $isInFocusPath = new EventEmitter<boolean>()

  before: CommandService = null

  constructor(
    @Optional() public screen: Screen,
    public logger: Logger,
    @SkipSelf() @Optional() public parent: CommandService
  ) {
    if (isRoot(this)) {
      this.rootNode = this
      this.isFocused = true
      this.isInFocusPath = true
      this.screen?.screen.addEventListener('keypress', (keyEvent: KeyboardEvent) => {
        // this.logger.log(`key: ${keyToString(key as any)}`)

        let key = keyEvent.key as unknown as Key
        if (this.before) {
          key = this.before.propagateKeypress(key)
        }
        if (key) {
          const unhandledKeypress = this.propagateKeypress(key)
          if (unhandledKeypress) {
            this.logger.log(`unhandled keypress: ${keyToString(unhandledKeypress)}`)
          }
        }
      })
    } else {
      this.rootNode = this.parent.rootNode
      this.parent.childCreated(this)
    }

    updateTree(this.rootNode)

    makeObservable(this, 'isFocused', '$isFocused')
    makeObservable(this, 'isInFocusPath', '$isInFocusPath')
    makeObservable(this, 'commands', '$commands')
    onChange(this, 'focusedChild', value => {
      updateTree(this.rootNode)
    })
  }

  private propagateKeypress(keypress): Key {
    if (this.focusedChild) {
      const focusStack = `focusStack: [${this.focusStack.map(child => 'child').join(',')}]`
      const components = `components: [${this.components.map(c => c.constructor.name).join(',')}]`
      const handlers = `handlers: [${Object.keys(this.keybinds)
        .filter(value => value.length > 0)
        .join(',')}]`
      // this.logger.log(`${padding(this)}${components}, ${handlers}, ${focusStack}`)

      const unhandledKeypress = this.focusedChild.propagateKeypress(keypress)
      if (unhandledKeypress) {
        return this.handleKeypress(unhandledKeypress)
      }
    } else {
      return this.handleKeypress(keypress)
    }
  }

  private handleKeypress(keypress): Key {
    // Keybind
    const key = keyToString(keypress)
    const ids = this.keybinds[key] || this.keybinds['else']
    if (ids) {
      const lastId = _.last(ids) as string
      if (lastId) {
        const unhandled = this.callCommand({ id: lastId, keys: keypress })
        return unhandled
      }
    }

    return keypress
  }

  /**
   * Example:
   * ```
   * register({keys: 'ctrl+r', func: () => {
   *   console.log('ctrl+r was pressed')
   * }})
   *
   * register({keys: 'else', func: keypress => {
   *   console.log(`${keypress.key} was pressed')
   * }})
   * ```
   */
  registerCommand(_command: Partial<Command>): Disposable {
    const command = sanitizeCommand(_command)

    this.commands[command.id] ??= []
    this.commands[command.id].push(command)

    for (const key of command.keys) {
      this.keybinds[key] ??= []
      this.keybinds[key].push(command.id)
    }

    return new Disposable(() => {
      this.removeCommand(command)
    })
  }

  private removeCommand(command: Command) {
    removeLastMatch(this.commands[command.id], command)
    for (const keys of command.keys) {
      removeLastMatch(this.keybinds[keys], command.id)
    }
  }

  callCommand(arg: { id: string; keys?: string; args?: any[] }) {
    const { id, keys, args } = arg
    const command = this.findCommand(id)
    const res = command.func(keys)
    return res
  }

  findCommand(id: string) {
    const command = retrieveLast(this.commands, id)
    if (command) {
      return command
    } else {
      if (this.parent) {
        return this.parent.findCommand(id)
      } else {
        assert(command, `could not find command: ${id}`)
      }
    }
  }

  /**
   * After calling this, this KeybindService gets priority for handling a keypress.
   * If it doesn't know what to do with it, it can pass it to its parent.
   * Usually called after a user interaction.
   */
  focus(child?: CommandService) {
    // To be able to call requestFocus() without arguments
    if (!child) {
      return this.parent?.focus(this)
    }

    let granted = false
    if (isRoot(this)) {
      granted = true
    } else {
      granted = this.parent?.focus(this)
    }

    if (granted) {
      moveToLast(this.focusStack, child)
      this.focusedChild = _.last(this.focusStack)
    }
    return granted
  }

  /**
   * Remove itself from its parent's focus stack.
   */
  unfocus(child?: CommandService) {
    // To be able to call unfocus() without arguments
    if (!child) {
      return this.parent?.unfocus(this)
    }

    remove(this.focusStack, child)
    this.focusedChild = _.last(this.focusStack)
  }

  /**
   * If multiple components request focus at the same time, the first one to request wins.
   * Usually called inside `ngOnInit`.
   * If the component should get focused not matter what, use `focus` instead.
   */
  requestFocus(child?: CommandService): boolean {
    const receivedFocusRequestRecently = this.receivedFocusRequestRecently
    this.receivedFocusRequestRecently = true
    async(() => {
      this.receivedFocusRequestRecently = false
    })

    if (receivedFocusRequestRecently) return false

    // To be able to call requestFocus() without arguments
    if (!child) {
      return this.parent?.focus(this)
    }

    let granted = false
    if (isRoot(this)) {
      granted = true
    } else {
      granted = this.parent?.focus(this)
    }

    if (granted) {
      moveToLast(this.focusStack, child)
      this.focusedChild = _.last(this.focusStack)
    }
    return granted
  }

  /**
   * If multiple components request the caret at the same time, the first one to request wins.
   * Usually called inside `ngOnInit`.
   */
  requestCaret(element) {
    const receivedCaretRequestRecently = this.receivedCaretRequestRecently
    this.receivedCaretRequestRecently = true
    async(() => {
      this.receivedCaretRequestRecently = false
    })

    if (receivedCaretRequestRecently) return false

    this.caretElement = element
    updateTree(this.rootNode)
    return true
  }

  /**
   *  Tell our parent that we're getting destroyed.
   */
  private ngOnDestroy() {
    if (this.parent) {
      this.unfocus()
      this.parent.childDestroyed(this)
    }
  }

  /**
   * Called by children to signal their creation.
   */
  private childCreated(child: CommandService) {
    this.children.push(child)
  }

  /**
   * Called by children to signal their destruction.
   */
  private childDestroyed(child: CommandService) {
    remove(this.focusStack, child)
    remove(this.children, child)
  }
}

export function retrieveLast(map, id) {
  const items = map[id]
  if (!items) return null
  return last(items)
}

export const EmptyCommand: Command = {
  id: null,
  name: null,
  keys: [],
  func: null,
  context: null,
  keywords: null,
  hidden: false,
}

function sanitizeCommand(_command: Partial<Command>): Command {
  let command = { ...EmptyCommand, ..._command }

  if (typeof _command.keys == 'string') {
    command.keys = [_command.keys]
  }

  if (_command.id) {
    command.name = _.startCase(_command.id)
  } else {
    command.id = command.keys[0]
    command.hidden = true
  }

  // @ts-ignore
  return command
}

/**
 * Is this the root keybind service?
 */
function isRoot(commandService: CommandService) {
  return !commandService.parent
}

/**
 * Convert a keypress to a string.
 * Example: {ctrl: true, key: 'r'} => 'ctrl+r'
 */
export function keyToString(key: Key) {
  let res = []
  if (key.ctrl) res.push('ctrl')
  if (key.alt) res.push('alt')
  if (key.shift) res.push('shift')
  if (key.meta) res.push('meta')
  if (key.name) res.push(key.name)
  return res.join('+')
}

/**
 * Register keybinds for the lifetime of the component
 */
export function registerCommands(
  component: Destroyable & { commandService: CommandService },
  commands: Partial<Command>[]
) {
  const disposables = commands.map(command => {
    return component.commandService.registerCommand({ ...command, context: component })
  })

  component.destroy$.subscribe(() => {
    Disposable.from(...disposables).dispose()
  })
}

// function registerMultiKeybind(
//   component: Destroyable & { commandService: CommandService },
//   multiKeybind: Command & { keys: string[] }
// ) {
//   multiKeybind.keys.forEach(key => {
//     component.commandService.registerCommand({ keys: key, func: multiKeybind.func })
//   })
// }

// function removeMultiKeybind(
//   component: Destroyable & { commandService: CommandService },
//   multiKeybind: Command & { keys: string[] }
// ) {
//   multiKeybind.keys.forEach(key => {
//     component.commandService.removeCommand({ keys: key, func: multiKeybind.func })
//   })
// }

function forEachChild(commandService: CommandService, func) {
  commandService.children.forEach(child => {
    func(child)
    forEachChild(child, func)
  })
}

function forEachChildInFocusPath(commandService: CommandService, func) {
  func(commandService)
  if (commandService.focusedChild) {
    forEachChildInFocusPath(commandService.focusedChild, func)
  }
}

function forFocusedChild(commandService: CommandService, func) {
  if (commandService.focusedChild) {
    forEachChildInFocusPath(commandService.focusedChild, func)
  } else {
    func(commandService)
  }
}

function updateTree(rootNode: CommandService) {
  if (!isRoot(rootNode)) throw new Error('should only be called on the keybind root')

  forEachChild(rootNode, child => {
    child.isFocused = false
  })

  forEachChildInFocusPath(rootNode, (child: CommandService) => {
    child.isFocused = true
  })

  forFocusedChild(rootNode, child => {
    if (!child.focusedChild) {
      if (rootNode.screen) {
        rootNode.screen.screen.activeElement = child.caretElement
      }
    }
  })
}

addToGlobal({
  keybinds: rgDebugKeybinds,
})

export function rgDebugKeybinds() {
  const ng = globalThis.rg.debug.component() as ComponentDebug
  const rootKeybindService = ng.more.injector.get(CommandService)

  return simplifyCommandService(rootKeybindService)
}

function simplifyCommandService(commandService: CommandService) {
  let res = _.pick(commandService, ['commands', 'keybinds', '_id']) as any
  if (commandService.focusedChild) {
    res.focusedChild = simplifyCommandService(commandService.focusedChild)
  }
  return res
}

export function padding(commandService: CommandService) {
  let spaces = ''
  for (let d = depth(commandService); d > 0; d--) {
    spaces += '  '
  }
  return `${commandService._id} ${spaces}`
}

export function depth(commandService: CommandService) {
  let depth = 0
  while (true) {
    if (commandService.parent) {
      depth++
      commandService = commandService.parent
    } else {
      return depth
    }
  }
}
