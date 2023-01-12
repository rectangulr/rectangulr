import { EventEmitter, Injectable, Optional, SkipSelf } from '@angular/core'
import _ from 'lodash'
import { BehaviorSubject } from 'rxjs'
import { ComponentDebug } from '../angular-terminal/debug'
import { Element } from '../angular-terminal/dom-terminal'
import { Logger } from '../angular-terminal/logger'
import { ScreenService } from '../angular-terminal/screen-service'
import { Destroyable } from '../utils/mixins'
import { makeObservable, onChange } from '../utils/reactivity'
import {
  addToGlobalRg,
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
  func: (key: Key) => Key | void | Promise<Key> | Promise<void>
  context?: any
  keywords: string
  hidden: boolean
}

let globalId = 0

@Injectable({
  providedIn: 'root',
})
export class ShortcutService {
  _id = ++globalId

  /**
   * Commands are stored by `id`. An `id` can have multiple commands.
   * This allows components to declare the same `id` without conflict, the latest command is used.
   * When the second component is destroyed the first command can be restored.
   */
  commands: { [id: string]: Command[] } = {}
  $commands = new BehaviorSubject(null)

  /**
   * A shortcut links a key (ex: ctrl+r) with a command id (ex: reload)
   */
  shortcuts: { [keys: string]: string[] } = {}

  focusStack: ShortcutService[] = []
  focusedChild: ShortcutService = null
  children: ShortcutService[] = []
  components = []
  rootNode: ShortcutService = null

  receivedFocusRequestRecently = false
  receivedCaretRequestRecently = false
  caretElement: Element = null

  isFocused = false
  $isFocused = new EventEmitter<boolean>()
  isInFocusPath = false
  $isInFocusPath = new EventEmitter<boolean>()

  before: ShortcutService = null

  focusPropagateUp = true
  focusIf = true

  constructor(
    @Optional() public screen: ScreenService,
    public logger: Logger,
    @SkipSelf() @Optional() public parent: ShortcutService
  ) {
    if (isRoot(this)) {
      this.rootNode = this
      this.isFocused = true
      this.isInFocusPath = true
      this.screen?.termScreen.addEventListener('keypress', (keyEvent: KeyboardEvent) => {
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
      const handlers = `handlers: [${Object.keys(this.shortcuts)
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
    const ids = this.shortcuts[key] || this.shortcuts['else']
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
      this.shortcuts[key] ??= []
      this.shortcuts[key].push(command.id)
    }

    return new Disposable(() => {
      this.removeCommand(command)
    })
  }

  private removeCommand(command: Command) {
    removeLastMatch(this.commands[command.id], command)
    for (const keys of command.keys) {
      removeLastMatch(this.shortcuts[keys], command.id)
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
   * If multiple components request focus at the same time, the first one to request wins.
   * Usually called inside `ngOnInit`.
   * If the component should get focused not matter what, use `focus` instead.
   */
  requestFocus(args?: { child?: ShortcutService; soft?: boolean }) {
    args = { child: null, soft: false, ...args }

    const log = message => {
      // this.logger.log({
      //   this: simplifyShortcutService(this),
      //   child: simplifyShortcutService(args.child),
      //   soft: args.soft,
      //   message,
      // })
    }

    // To be able to call focus() without arguments
    if (!args.child) {
      return this.parent?.requestFocus({ ...args, child: this })
    }

    if (!args.child.focusIf) {
      // log('!focusIf')
      return
    }

    if (args.soft) {
      const receivedFocusRequestRecently = this.receivedFocusRequestRecently
      this.receivedFocusRequestRecently = true
      async(() => {
        this.receivedFocusRequestRecently = false
      })
      if (receivedFocusRequestRecently) {
        // log('receivedFocusRequestRecently')
        return
      }
    }

    moveToLast(this.focusStack, args.child)
    this.focusedChild = _.last(this.focusStack)
    // log('received')

    if (this.focusPropagateUp) {
      this.parent?.requestFocus({ ...args, child: this })
    } else {
      // log('!focusPropagateUp')
      return
    }
  }

  /**
   * Give up the focus.
   * The next shortcutService in the focusStack gets focused.
   */
  unfocus(child?: ShortcutService) {
    // To be able to call unfocus() without arguments
    if (!child) {
      return this.parent?.unfocus(this)
    }

    remove(this.focusStack, child)
    this.focusedChild = _.last(this.focusStack)
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
  private childCreated(child: ShortcutService) {
    this.children.push(child)
  }

  /**
   * Called by children to signal their destruction.
   */
  private childDestroyed(child: ShortcutService) {
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
function isRoot(shortcutService: ShortcutService) {
  return !shortcutService.parent
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
export function registerShortcuts(
  component: Destroyable & { shortcutService: ShortcutService },
  commands: Partial<Command>[]
) {
  const disposables = commands.map(command => {
    return component.shortcutService.registerCommand({ ...command, context: component })
  })

  component.destroy$.subscribe(() => {
    Disposable.from(...disposables).dispose()
  })
}

// function registerMultiKeybind(
//   component: Destroyable & { shortcutService: ShortcutService },
//   multiKeybind: Command & { keys: string[] }
// ) {
//   multiKeybind.keys.forEach(key => {
//     component.shortcutService.registerCommand({ keys: key, func: multiKeybind.func })
//   })
// }

// function removeMultiKeybind(
//   component: Destroyable & { shortcutService: ShortcutService },
//   multiKeybind: Command & { keys: string[] }
// ) {
//   multiKeybind.keys.forEach(key => {
//     component.shortcutService.removeCommand({ keys: key, func: multiKeybind.func })
//   })
// }

function forEachChild(shortcutService: ShortcutService, func) {
  shortcutService.children.forEach(child => {
    func(child)
    forEachChild(child, func)
  })
}

function forEachChildInFocusPath(shortcutService: ShortcutService, func) {
  func(shortcutService)
  if (shortcutService.focusedChild) {
    forEachChildInFocusPath(shortcutService.focusedChild, func)
  }
}

function forFocusedChild(shortcutService: ShortcutService, func) {
  if (shortcutService.focusedChild) {
    forEachChildInFocusPath(shortcutService.focusedChild, func)
  } else {
    func(shortcutService)
  }
}

function updateTree(rootNode: ShortcutService) {
  if (!isRoot(rootNode)) throw new Error('should only be called on the keybind root')

  forEachChild(rootNode, child => {
    child.isFocused = false
  })

  forEachChildInFocusPath(rootNode, (child: ShortcutService) => {
    child.isFocused = true
  })

  forFocusedChild(rootNode, child => {
    if (!child.focusedChild) {
      if (rootNode.screen) {
        rootNode.screen.termScreen.activeElement = child.caretElement
      }
    }
  })
}

addToGlobalRg({
  keybinds: rgDebugKeybinds,
})

export function rgDebugKeybinds() {
  const ng = globalThis.rg.component() as ComponentDebug
  const rootKeybindService = ng.more.injector.get(ShortcutService)

  return simplifyShortcutService(rootKeybindService)
}

function simplifyShortcutService(shortcutService: ShortcutService) {
  let res = _.pick(shortcutService, ['commands', 'keybinds', 'children', '_id']) as any
  if (shortcutService.focusedChild) {
    res.focusedChild = simplifyShortcutService(shortcutService.focusedChild)
  }

  res.toString = () => {
    const componentNames = Object.values(shortcutService.commands)
      .map(commands => _.last(commands))
      .map(command => command.context.constructor.name)
      // .reduce((prev, cur) => {
      //   if (!prev.includes(cur)) {
      //     prev.push(cur)
      //   }
      // }, [])
      .join()

    return `${shortcutService._id} (${componentNames})`
  }
  return res
}

export function padding(shortcutService: ShortcutService) {
  let spaces = ''
  for (let d = depth(shortcutService); d > 0; d--) {
    spaces += '  '
  }
  return `${shortcutService._id} ${spaces}`
}

export function depth(shortcutService: ShortcutService) {
  let depth = 0
  while (true) {
    if (shortcutService.parent) {
      depth++
      shortcutService = shortcutService.parent
    } else {
      return depth
    }
  }
}