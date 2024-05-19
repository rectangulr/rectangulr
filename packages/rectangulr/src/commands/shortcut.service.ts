import { DestroyRef, Injectable, OnDestroy, Optional, SkipSelf, inject, signal } from '@angular/core'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { NiceView } from '../angular-terminal/debug'
import { Element } from '../angular-terminal/dom-terminal'
import { Logger } from '../angular-terminal/logger'
import { ScreenService } from '../angular-terminal/screen-service'
import { Destroyable } from '../utils/mixins'
import { onChange } from '../utils/reactivity'
import { addToGlobalRg, assert, last, remove, removeLastMatch } from '../utils/utils'
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
  name: string = null

  /**
   * Commands are stored by `id`. An `id` can have multiple commands.
   * This allows components to declare the same `id` without conflict, the latest command is used.
   * When the second component is destroyed the first command can be restored.
   */
  $commands = signal<{ [id: string]: Command[] }>({})

  /**
   * A shortcut links a key (ex: ctrl+r) with a command id (ex: reload)
   */
  shortcuts: { [keys: string]: string[] } = {}

  focusStack: ShortcutService[] = []
  focusedChild: ShortcutService = null
  children: ShortcutService[] = []
  components = []
  rootNode: ShortcutService = null

  receivedCaretRequestRecently = false
  askedForFocusThisTick: { child: ShortcutService; source: ShortcutService; reason: string }[] = []
  caretElement: Element = null

  $isFocused = signal(false)
  $isInFocusPath = signal(false)

  before: ShortcutService = null

  focusPropagateUp = true
  focusIf = true
  debugDenied = false
  logEnabled = false

  constructor(
    @Optional() public screen: ScreenService,
    public logger: Logger,
    @SkipSelf() @Optional() public parent: ShortcutService,
    // public ngZone: NgZone
  ) {
    if (isRoot(this)) {
      this.rootNode = this
      this.$isFocused.set(false)
      this.$isInFocusPath.set(true)
      this.screen?.termScreen.addEventListener('keypress', key => this.incomingKey(key))
      // this.screen?.termScreen.addEventListener('data', data => {
      //   for (const key of data.buffer) {
      //     this.incomingKey(key)
      //   }
      // })
    } else {
      this.rootNode = this.parent.rootNode
      this.parent.childCreated(this)
    }

    updateTree(this.rootNode)

    onChange(this, 'focusedChild', value => {
      setTimeout(() => updateTree(this.rootNode))
    })

    onChange(this, 'caretElement', value => {
      const rootNode = this.rootNode
      forFocusedChild(rootNode, child => {
        if (rootNode.screen) {
          rootNode.screen.termScreen.activeElement = child.caretElement
        }
      })
    })

    // subscribe(this, this.ngZone.onStable, () => {
    //   this.receivedFocusThisTick = 0
    //   // this.logEnabled && this.logger.log(`reset receivedFocusThisTick to ${this.receivedFocusThisTick}`)
    // })
  }

  incomingKey(keyEvent) {
    let key = keyEvent.key as unknown as Key
    // this.logEnabled && this.logger.log(`key: ${keyToString(key)}`)
    if (this.before) {
      key = this.before.propagateKeypress(key)
    }
    if (key) {
      const unhandledKeypress = this.propagateKeypress(key)
      if (unhandledKeypress) {
        this.logEnabled && this.logger.log(`unhandled keypress: ${keyToString(unhandledKeypress)}`)
        // @ts-ignore
        // ngDevMode &&
        //   assert(false, { message: 'unhandled key', focused: getFocusedNode(this.rootNode) })
      }
    }
  }

  private propagateKeypress(keypress): Key {
    if (this.focusedChild) {
      // const focusStack = `focusStack: [${this.focusStack.map(child => 'child').join(',')}]`
      // const components = `components: [${this.components.map(c => c.constructor.name).join(',')}]`
      // const handlers = Object.keys(this.shortcuts)
      //   .filter(value => value.length > 0)
      //   .join(',')
      // const handlersString = `handlers: [${handlers}]`
      // this.logEnabled && this.logger.log(`${padding(this)}${components}, ${handlers}, ${focusStack}`)

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
    const commandIds = this.shortcuts[key]
    let unhandled = keypress
    if (commandIds) {
      for (let i = commandIds.length - 1; i >= 0; i--) {
        const id = commandIds[i]
        unhandled = this.callCommand({ id: id, keys: keypress })
        if (!unhandled) {
          break
        }
      }
    }

    if (unhandled) {
      const elseIds = this.shortcuts['else']
      if (elseIds) {
        for (let i = elseIds.length - 1; i >= 0; i--) {
          const id = elseIds[i]
          unhandled = this.callCommand({ id: id, keys: keypress })
          if (!unhandled) {
            break
          }
        }
      }
    }

    return unhandled
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

    this.$commands.update(commands => {
      const array = commands[command.id] ?? []
      return { ...commands, [command.id]: [...array, command] }
      // if (command.id == 'down' && commands[command.id].length > 1) debugger
      // assertDebug(commands[command.id].length <= 1)
    })

    for (const key of command.keys) {
      this.shortcuts[key] ??= []
      this.shortcuts[key].push(command.id)
    }

    return new Disposable(() => {
      this.removeCommand(command)
    })
  }

  private removeCommand(command: Command) {
    this.$commands.update(commands => {
      const array = commands[command.id]
      if (array) {
        removeLastMatch(array, command)
      }
      return { ...commands }
    })
    for (const keys of command.keys) {
      removeLastMatch(this.shortcuts[keys], command.id)
    }
  }

  callCommand(arg: { id: string; keys?: string; args?: any[] }) {
    const { id, keys, args } = arg
    const command = this.findCommand(id)
    let res = command.func(keys)
    return res
  }

  findCommand(id: string) {
    const command = retrieveLast(this.$commands(), id)
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
   */
  requestFocus(args?: {
    child?: ShortcutService
    soft?: boolean
    reason?: string
    source?: ShortcutService
  }) {
    args = { child: null, soft: true, ...args }

    // To be able to call focus() without arguments
    if (!args.child) {
      this.parent?.requestFocus({ ...args, child: this, source: this })
      this.logEnabled && this.logger.log(`focused: ${stringifyPathToLeaf(this)}`)
      return
    }

    if (!args.child.focusIf) {
      this.logEnabled && this.logger.log(`denied - ${args.child} - focusIf`)
      if (this.debugDenied) { debugger }
      return
    }

    if (this.askedForFocusThisTick.find(item => item.child === args.child)) {
      this.logEnabled && this.logger.log(`denied - ${args.child} - askedForFocusThisTick`)
      if (this.debugDenied) { debugger }
      return
    }

    _.remove(this.focusStack, i => i == args.child)
    let index = this.focusStack.length
    if (args.soft) index -= this.askedForFocusThisTick.length
    index = _.clamp(index, 0, this.focusStack.length)
    const stackBefore = this.focusStack.map(i => i._id).join(',')
    this.focusStack.splice(index, 0, args.child)
    const stackAfter = this.focusStack.map(i => i._id).join(',')
    this.logEnabled && this.logger.log(`${stringifyPathToNode(this)} : [${stackBefore}] ->  [${stackAfter}]`)

    this.askedForFocusThisTick.push({ child: args.child, reason: args.reason, source: args.source })
    this.focusedChild = _.last(this.focusStack)
    assert(this.focusedChild, 'should focus a child')
    // log('received')

    this.logEnabled && this.logger.log('setTimeout')
    setTimeout(() => {
      this.askedForFocusThisTick = []
      this.logEnabled && this.logger.log(`focused end of tick: ${stringifyPathToLeaf(this)}`)
    })

    if (this.focusPropagateUp) {
      this.parent?.requestFocus({ ...args, child: this })
    } else {
      // log('!focusPropagateUp')
      if (this.debugDenied) { debugger }
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
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
    if (this.parent) {
      this.unfocus()
      this.parent.childDestroyed(this)
    }
  }
  destroy$ = new Subject()

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

  toString() {
    return stringifyPathToNode(this)
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
  commands: Partial<Command>[],
  options: { shortcutService: ShortcutService, onDestroy: DestroyRef['onDestroy'] } = { shortcutService: null, onDestroy: null }
) {
  const shortcutService = options.shortcutService ?? inject(ShortcutService)
  const disposables = commands.map(command => {
    // { ...command, context: component }
    return shortcutService.registerCommand(command)
  })

  const onDestroy = options.onDestroy ?? (f => inject(DestroyRef).onDestroy(f))
  onDestroy(() => {
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

function forEachChild(shortcutService: ShortcutService, func: (child: ShortcutService) => void) {
  func(shortcutService)
  shortcutService.children.forEach(child => {
    forEachChild(child, func)
  })
}

function forEachChildInFocusPath(
  shortcutService: ShortcutService,
  func: (child: ShortcutService) => void
) {
  func(shortcutService)
  if (shortcutService.focusedChild) {
    forEachChildInFocusPath(shortcutService.focusedChild, func)
  }
}

function forFocusedChild(shortcutService: ShortcutService, func: (child: ShortcutService) => void) {
  if (shortcutService.focusedChild) {
    forFocusedChild(shortcutService.focusedChild, func)
  } else {
    func(shortcutService)
  }
}

export function getFocusedNode(shortcutService: ShortcutService): ShortcutService {
  if (shortcutService.focusedChild) {
    return getFocusedNode(shortcutService.focusedChild)
  } else {
    return shortcutService
  }
}

function updateTree(rootNode: ShortcutService) {
  if (!isRoot(rootNode)) throw new Error('should only be called on the keybind root')

  forEachChild(rootNode, child => {
    child.$isFocused.set(false)
    child.$isInFocusPath.set(false)
  })

  forEachChildInFocusPath(rootNode, child => {
    child.$isInFocusPath.set(true)
  })

  forFocusedChild(rootNode, child => {
    child.$isFocused.set(true)
    if (rootNode.screen) {
      rootNode.screen.termScreen.activeElement = child.caretElement
    }
  })

  // rootNode.logger.log(`focused: ${stringifyFocusedPath(rootNode)}`)
}

addToGlobalRg({
  keybinds: rgDebugKeybinds,
})

export function rgDebugKeybinds() {
  const ng = globalThis.rg.component() as NiceView
  const rootKeybindService = ng.more.injector.get(ShortcutService)
  const focusedKeybindService = getFocusedNode(rootKeybindService)

  return simplifyShortcutService(focusedKeybindService)
}

function simplifyShortcutService(shortcutService: ShortcutService) {
  return new SimplifiedShortcutService(shortcutService)
}

class SimplifiedShortcutService {
  ref: ShortcutService
  children: ShortcutService[]
  focusedChild: ShortcutService
  commands: { [id: string]: Command[] }
  _id: number
  shortcuts: { [keys: string]: string[] }

  constructor(shortcutService: ShortcutService) {
    this.ref = shortcutService
    this._id = shortcutService._id
    this.children = shortcutService.children
    this.shortcuts = shortcutService.shortcuts
    this.focusedChild = shortcutService.focusedChild
    this.commands = shortcutService.$commands()
  }

  get parent() {
    if (this.ref.parent) {
      return simplifyShortcutService(this.ref.parent)
    } else {
      return null
    }
  }

  toString() {
    return stringifyPathToNode(this.ref)
  }
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

function stringifyComponent(component: any) {
  const toString = component.toString()
  if (toString == '[object Object]') {
    return component.constructor.name
  } else {
    return toString
  }
}

function stringifyNode(shortcutService: ShortcutService) {
  let componentNames = Object.values(shortcutService.$commands())
    .map(commands => _.last(commands))
    .filter(c => !!c && c.context)
    .map(command => stringifyComponent(command.context))
  componentNames = [...new Set(componentNames)]
  const componentNamesString = componentNames.join()
  const name = shortcutService.name ? `[${shortcutService.name}]` : ''

  return `${shortcutService._id} ${name} (${componentNamesString})`
}

function stringifyPathToNode(node: ShortcutService) {
  const nodes = []
  let currentNode = node.rootNode
  while (true) {
    nodes.push(currentNode)
    if (currentNode == node) {
      break
    } else {
      currentNode = currentNode.focusedChild
      if (!currentNode) break
    }
  }
  return nodes.map(node => stringifyNode(node)).join(' -> ')
}

function stringifyPathToLeaf(node: ShortcutService) {
  const nodes = []
  let currentNode = node.rootNode
  while (currentNode) {
    nodes.push(currentNode)
    currentNode = currentNode.focusedChild
  }
  return nodes.map(node => stringifyNode(node)).join(' -> ')
}
