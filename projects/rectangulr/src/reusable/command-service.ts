import { ElementRef, EventEmitter, Injectable, Optional, SkipSelf } from '@angular/core'
import _ from 'lodash'
import { CommandsService } from '../commands/command-service'
import { Key } from '../commands/key-sequence'
import { Debug } from '../lib/debug'
import { Logger } from '../lib/logger'
import { Screen } from '../lib/screen-service'
import { Element } from '../mylittledom'
import { Destroyable } from '../utils/mixins'
import { onChange, onChangeEmit } from '../utils/reactivity'
import { moveToLast, remove } from '../utils/utils'

export interface Command {
  id?: string
  keys?: string | string[]
  func: (key: Key) => Key[] | void | Promise<Key[]> | Promise<void>
}

let globalId = 0

@Injectable({
  providedIn: 'root',
})
export class CommandService {
  _id = ++globalId

  commands: { [id: string]: { id: string; func: Function } } = {}

  keybinds: { [keys: string]: string[] } = {}
  wildcard: Function = null

  focusStack: CommandService[] = []
  focusedChild: CommandService = null
  children: CommandService[] = []
  components = []
  rootNode: CommandService = null

  receivedFocusRequestRecently = false
  receivedCaretRequestRecently = false
  caretElement: Element = null

  isFocused = false
  isFocusedChanges = new EventEmitter<boolean>()
  isInFocusPath = false
  isInFocusPathChanges = new EventEmitter<boolean>()

  before: CommandService = null

  constructor(
    @Optional() public elementRef: ElementRef,
    public screen: Screen,
    public logger: Logger,
    public commandsService: CommandsService,
    @SkipSelf() @Optional() public parent: CommandService
  ) {
    if (isRoot(this)) {
      this.rootNode = this
      this.isFocused = true
      this.isInFocusPath = true
      this.screen.screen.addEventListener('keypress', (keyEvent: KeyboardEvent) => {
        // this.logger.log(`key: ${keyToString(keyEvent.key as any)}`)

        let key = keyEvent.key as unknown as Key
        if (this.before) {
          key = this.before.propagateKeypress(keyEvent.key)
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

    onChangeEmit(this, 'isFocused', 'isFocusedChanges')
    onChangeEmit(this, 'isInFocusPath', 'isInFocusPathChanges')
    onChange(this, 'focusedChild', value => {
      updateTree(this.rootNode)
    })
  }

  /**
   *  Tell our parent that we're getting destroyed.
   */
  ngOnDestroy() {
    if (this.parent) {
      this.unfocus()
      this.parent.childDestroyed(this)
    }
  }

  /**
   * Called by children to signal their creation.
   */
  childCreated(child: CommandService) {
    this.children.push(child)
  }

  /**
   * Called by children to signal their destruction.
   */
  childDestroyed(child: CommandService) {
    remove(this.focusStack, child)
    remove(this.children, child)
  }

  propagateKeypress(keypress): Key {
    if (depth(this) == 0) {
      // this.logger.log(`${padding(this)}keypress: ${keyToString(keypress)}`)
    }

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
    const funcs = this.keybinds[key]
    if (funcs) {
      const lastFunc = _.last(funcs)
      if (lastFunc) {
        const unhandled = lastFunc?.(keypress)
        // this.logger.log(`${padding(this)}handler: ${lastFunc}`)
        return unhandled
      }
    }

    // Else
    if (this.wildcard) {
      // this.logger.log(`${padding(this)}else handler: ${this.wildcard}`)
      return this.wildcard(keypress)
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
  registerCommand(command: Command) {
    const { id, keys, func } = sanitizeCommand(command)
    this.commands[id] = { ...command, id }
    this.registerKeys(keys, id)
  }

  registerKeys(keys, commandId) {
    // Else
    if (keys == 'else') {
      this.wildcard = commandId
      return
    }

    // Keybind
    this.keybinds[keys] ??= []
    this.keybinds[keys].push(commandId)
  }

  removeKeys(keys, commandId) {
    const ids = this.keybinds[keys]
    if (ids) {
      remove(ids, commandId)
    }

    if (keys == 'else') {
      remove(this.wildcard, commandId)
    }
  }

  removeCommand(command: Command) {
    const { id, keys, func } = sanitizeCommand(command)
    this.commands[id] = null

    this.removeKeys(keys, id)
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
    setTimeout(() => {
      this.receivedFocusRequestRecently = false
    }, 0)

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
    setTimeout(() => {
      this.receivedCaretRequestRecently = false
    }, 0)

    if (receivedCaretRequestRecently) return false

    this.caretElement = element
    updateTree(this.rootNode)
    return true
  }
}

function sanitizeCommand(command: Command) {
  const { id, keys } = command
  if (id) return command
  if (Array.isArray(keys) && keys.length > 0) return { ...command, id: keys[0] }
  if (typeof keys == 'string') return { ...command, id: keys }
  throw new Error('command definition is wrong')
}

/**
 * Is this the root keybind service?
 */
function isRoot(keybindService: CommandService) {
  return !keybindService.parent
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
  component: Destroyable & { keybindService: CommandService },
  commands: Command[]
) {
  commands.forEach(command => {
    component.keybindService.registerCommand(command)
  })

  component.destroy$.subscribe(() => {
    commands.forEach(keybind => {
      component.keybindService.removeCommand(keybind)
    })
  })
}

function registerMultiKeybind(
  component: Destroyable & { keybindService: CommandService },
  multiKeybind: Command & { keys: string[] }
) {
  multiKeybind.keys.forEach(key => {
    component.keybindService.registerCommand({ keys: key, func: multiKeybind.func })
  })
}

function removeMultiKeybind(
  component: Destroyable & { keybindService: CommandService },
  multiKeybind: Command & { keys: string[] }
) {
  multiKeybind.keys.forEach(key => {
    component.keybindService.removeCommand({ keys: key, func: multiKeybind.func })
  })
}

function forEachChild(keybindService: CommandService, func) {
  keybindService.children.forEach(child => {
    func(child)
    forEachChild(child, func)
  })
}

function forEachChildInFocusPath(keybindService: CommandService, func) {
  func(keybindService)
  if (keybindService.focusedChild) {
    forEachChildInFocusPath(keybindService.focusedChild, func)
  }
}

function forFocusedChild(keybindService: CommandService, func) {
  if (keybindService.focusedChild) {
    forEachChildInFocusPath(keybindService.focusedChild, func)
  } else {
    func(keybindService)
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
      rootNode.screen.screen.activeElement = child.caretElement
    }
  })
}

registerKeyDebug()

export function registerKeyDebug() {
  globalThis['rgDebugKeybinds'] = rgDebugKeybinds
}

export function rgDebugKeybinds() {
  const ng = globalThis.rgDebug() as Debug
  const rootKeybindService = ng.more.injector.get(CommandService)
  return rootKeybindService
  // let keybindService = rootKeybindService
  // while (true) {
  //   const selectedChild = _.last(keybindService.focusStack)
  //   if (selectedChild) {
  //     keybindService = selectedChild
  //   } else {
  //     return keybindService
  //   }
  // }
}

export function padding(keybindService: CommandService) {
  let spaces = ''
  for (let d = depth(keybindService); d > 0; d--) {
    spaces += '  '
  }
  return `${keybindService._id} ${spaces}`
}

export function depth(keybindService: CommandService) {
  let depth = 0
  while (true) {
    if (keybindService.parent) {
      depth++
      keybindService = keybindService.parent
    } else {
      return depth
    }
  }
}
