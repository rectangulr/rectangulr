import { DestroyRef, Injectable, Injector, inject } from '@angular/core'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { NiceView } from '../angular-terminal/debug'
import { Element } from '../angular-terminal/dom-terminal'
import { LOGGER } from '../angular-terminal/logger'
import { ScreenService } from '../angular-terminal/screen-service'
import { addToGlobalRg } from '../utils/addToGlobalRg'
import { assert } from '../utils/Assert'
import { signal2 } from '../utils/Signal2'
import { last, removeLastMatch } from '../utils/utils'
import { Disposable } from './disposable'
import { Key } from './keypress-parser'
import { logFocus } from "./symbols"
import { LogPointService } from '../utils/LogPoint'

/**
 * Commands are a function with an `id`.
 * You can provide a default keybind with `keys`.
 */
export interface Command {
  id: string
  name: string
  keys: string | string[]
  func: (key: Key) => Key | void | Promise<Key> | Promise<void>
  context?: Context
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
  readonly commands = signal2<{ [id: string]: Command[] }>({})

  /**
   * A shortcut links a key (ex: ctrl+r) with a command id (ex: reload)
   */
  readonly shortcuts = signal2<{ [keys: string]: string[] }>({})

  readonly focusStack = signal2<ShortcutService[]>([])
  readonly focusedChild = signal2<ShortcutService>(null)
  readonly children = signal2<ShortcutService[]>([])
  readonly components = signal2([])
  readonly rootNode = signal2<ShortcutService>(null)

  readonly receivedCaretRequestRecently = signal2(false)
  readonly askedForFocusThisTick = signal2<{ child: ShortcutService; source: ShortcutService; reason: string }[]>([])
  readonly caretElement = signal2<Element>(null)

  readonly isFocused = signal2(false)
  readonly isInFocusPath = signal2(false)

  readonly before = signal2<ShortcutService | undefined>(undefined)

  readonly focusPropagateUp = signal2(true)
  readonly focusIf = signal2(true)

  injector = inject(Injector)
  screen = inject(ScreenService, { optional: true })
  logger = inject(LOGGER)
  parent = inject(ShortcutService, { skipSelf: true, optional: true })
  reason: string = undefined
  private timeout: any

  lp = inject(LogPointService)

  constructor() {
    if (isRoot(this)) {
      this.rootNode.$ = this
      this.isFocused.$ = false
      this.isInFocusPath.$ = true
      this.screen?.termScreen.addEventListener('keypress', key => this.incomingKey(key))
      // this.screen?.termScreen.addEventListener('data', data => {
      //   for (const key of data.buffer) {
      //     this.incomingKey(key)
      //   }
      // })
    } else {
      this.rootNode.$ = this.parent.rootNode()
      this.parent.childCreated(this)
    }

    updateTree(this.rootNode())
    this.focusedChild.subscribe(() => {
      updateTree(this.rootNode())
    })

    this.caretElement.subscribe(value => {
      const rootNode: ShortcutService = this.rootNode()
      forFocusedChild(rootNode, child => {
        if (rootNode.screen) {
          rootNode.screen.termScreen.activeElement = child.caretElement()
        }
      })
    })

    // subscribe(this, this.ngZone.onStable, () => {
    //   this.receivedFocusThisTick = 0
    //   // this.lp.point(`reset receivedFocusThisTick to ${this.receivedFocusThisTick}`)
    // })
  }

  incomingKey(keyEvent) {
    let key = keyEvent.key as unknown as Key
    // this.lp.point(`key: ${keyToString(key)}`)
    if (this.before()) {
      key = this.before().propagateKeypress(key)
    }
    if (key) {
      const unhandledKeypress = this.propagateKeypress(key)
      if (unhandledKeypress) {
        this.lp.logPoint('IncomingKey.UnhandledKeypress', keyToString(unhandledKeypress))
        // ngDevMode &&
        //   assert(false, { message: 'unhandled key', focused: getFocusedNode(this.rootNode) })
      }
    }
  }

  private propagateKeypress(keypress): Key {
    if (this.focusedChild()) {
      // const focusStack = `focusStack: [${this.focusStack().map(child => 'child').join(',')}]`
      // const components = `components: [${this.components.map(c => c.constructor.name).join(',')}]`
      // const handlers = Object.keys(this.shortcuts())
      //   .filter(value => value.length > 0)
      //   .join(',')
      // const handlersString = `handlers: [${handlers}]`
      // this.lp.point(`${padding(this)}${components}, ${handlers}, ${focusStack}`)

      const unhandledKeypress = this.focusedChild().propagateKeypress(keypress)
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
    const commandIds = this.shortcuts()[key]
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
      const elseIds = this.shortcuts()['else']
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

    this.commands.update(commands => {
      const array = commands[command.id] ?? []
      return { ...commands, [command.id]: [...array, command] }
      // if (command.id == 'down' && commands[command.id].length > 1) debugger
      // assertDebug(commands[command.id].length <= 1)
    })

    for (const key of command.keys) {
      this.shortcuts()[key] ??= []
      this.shortcuts()[key].push(command.id)
    }
    this.shortcuts.update(shortcuts => ({ ...shortcuts }))

    return new Disposable(() => {
      this.removeCommand(command)
    })
  }

  private removeCommand(command: Command) {
    this.commands.update(commands => {
      const array = commands[command.id]
      if (array) {
        removeLastMatch(array, command)
      }
      return { ...commands }
    })
    for (const keys of command.keys) {
      removeLastMatch(this.shortcuts()[keys], command.id)
    }
    this.shortcuts.update(shortcuts => ({ ...shortcuts }))
  }

  callCommand(arg: { id: string; keys?: string; args?: any[] }) {
    const { id, keys, args } = arg
    const command = this.findCommand(id)
    let res = command.func(keys)
    return res
  }

  findCommand(id: string) {
    const command = retrieveLast(this.commands(), id)
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
  }): boolean {
    args = { child: null, soft: true, ...args }

    // To be able to call focus() without arguments
    if (!args.child) {
      if (!this.parent) {
        return true
      } else {
        const success = this.parent.requestFocus({ ...args, child: this, source: this })
        if (success) {
          // this.lp.point(`focused: ${stringifyPathToLeaf(this)}`)
          this.reason = args.reason
        }
        return success
      }
    }

    if (!args.child.focusIf()) {
      this.lp.logPoint('RequestFocus.Denied.FocusIf', { child: args.child })
      return false
    }

    if (this.askedForFocusThisTick().find(item => item.child === args.child)) {
      this.lp.logPoint('RequestFocus.Denied.askedForFocusThisTick', { child: args.child })
      return false
    }

    if (this.focusedChild() == args.child) {
      this.lp.logPoint(`already focused - ${args.child}`)
      this.lp.logPoint('RequestFocus.Denied.AlreadyFocused', { child: args.child })
    } else {
      this.focusStack.update(value => value.filter(i => i != args.child))
      let index = this.focusStack().length
      if (args.soft) index -= this.askedForFocusThisTick().length
      index = _.clamp(index, 0, this.focusStack().length)
      const stackBefore = this.focusStack().map(i => i._id).join(',')
      this.focusStack.update(value => {
        value.splice(index, 0, args.child)
        return [...value]
      })
      const stackAfter = this.focusStack().map(i => i._id).join(',')
      this.lp.logPoint(`partial focus (${args.reason}): ${stringifyPathToFocusedNode(this)} : [${stackBefore}] ->  [${stackAfter}]`)

      this.askedForFocusThisTick.update(value => [...value, { child: args.child, reason: args.reason, source: args.source }])
      this.focusedChild.$ = _.last(this.focusStack())
      assert(this.focusedChild(), 'should focus a child')
      // log('received')

      // this.lp.point('setTimeout')
      if (this.timeout === undefined) {
        this.timeout = setTimeout(() => {
          this.askedForFocusThisTick.$ = []
          this.lp.logPoint(`focused after setTimeout: ${stringifyPathToFocusedNode(this)}`)
          this.timeout = undefined
        })
      }
    }

    if (this.focusPropagateUp()) {
      if (this.parent) {
        return this.parent.requestFocus({ ...args, child: this })
      } else {
        return true
      }
    } else {
      // log('!focusPropagateUp()')
      this.lp.logPoint('RequestFocus.Denied')
      return false
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

    this.askedForFocusThisTick.update(value => value.filter(i => i.child != child))
    this.focusStack.update(stack => stack.filter(i => i != child))
    this.focusedChild.$ = _.last(this.focusStack())
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
    this.children.update(value => [...value, child])
  }

  /**
   * Called by children to signal their destruction.
   */
  private childDestroyed(child: ShortcutService) {
    this.focusStack.update(stack => stack.filter(i => i != child))
    this.children.update(c => c.filter(i => i != child))
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

type Context = {
  name: string
  ref: any
}

/**
 * Register keybinds for the lifetime of the component
 */
export function registerShortcuts(
  commands: Partial<Command>[],
  options: {
    shortcutService?: ShortcutService,
    onDestroy?: DestroyRef['onDestroy'],
    context?: Context,
  } = { shortcutService: undefined, onDestroy: undefined }
) {
  const shortcutService = options.shortcutService ?? inject(ShortcutService)
  const disposables = commands.map(command => {
    return shortcutService.registerCommand({ ...command, context: options.context })
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
  shortcutService.children().forEach(child => {
    forEachChild(child, func)
  })
}

function forEachChildInFocusPath(
  shortcutService: ShortcutService,
  func: (child: ShortcutService) => void
) {
  func(shortcutService)
  if (shortcutService.focusedChild()) {
    forEachChildInFocusPath(shortcutService.focusedChild(), func)
  }
}

function forFocusedChild(shortcutService: ShortcutService, func: (child: ShortcutService) => void) {
  if (shortcutService.focusedChild()) {
    forFocusedChild(shortcutService.focusedChild(), func)
  } else {
    func(shortcutService)
  }
}

export function getFocusedNode(shortcutService: ShortcutService): ShortcutService {
  if (shortcutService.focusedChild()) {
    return getFocusedNode(shortcutService.focusedChild())
  } else {
    return shortcutService
  }
}

function updateTree(rootNode: ShortcutService) {
  if (!isRoot(rootNode)) throw new Error('should only be called on the keybind root')

  forEachChild(rootNode, child => {
    child.isFocused.set(false)
    child.isInFocusPath.set(false)
  })

  forEachChildInFocusPath(rootNode, child => {
    child.isInFocusPath.set(true)
  })

  forFocusedChild(rootNode, child => {
    child.isFocused.set(true)
    if (rootNode.screen) {
      rootNode.screen.termScreen.activeElement = child.caretElement()
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
    this.children = shortcutService.children()
    this.shortcuts = shortcutService.shortcuts()
    this.focusedChild = shortcutService.focusedChild()
    this.commands = shortcutService.commands()
  }

  get parent() {
    if (this.ref.parent) {
      return simplifyShortcutService(this.ref.parent)
    } else {
      return null
    }
  }

  toString() {
    return stringifyPathToFocusedNode(this.ref)
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

// function stringifyComponent(component: any) {
//   const toString = component.toString()
//   if (toString == '[object Object]') {
//     return component.constructor.name
//   } else {
//     return toString
//   }
// }

function stringifyNode(shortcutService: ShortcutService) {
  let componentNames = Object.values(shortcutService.commands())
    .map(commands => _.last(commands))
    .filter(c => !!c && c.context)
    .map(command => {
      const stringified = String(command.context.ref)
      if (stringified !== '[object Object]') {
        return stringified
      } else {
        return command.context.name
      }
    })
  componentNames = [...new Set(componentNames)]
  const componentNamesString = componentNames.join()
  const name = shortcutService.name ?? ''

  return `[${shortcutService._id} ${name}](${componentNamesString})`
}

function stringifyPathToNode(node: ShortcutService) {
  // Walk up the parents from the node
  const nodes = []
  let currentNode: ShortcutService = node
  while (currentNode) {
    nodes.unshift(stringifyNode(currentNode))
    currentNode = currentNode.parent
  }
  return nodes.join(' -> ')
}

function stringifyPathToFocusedNode(node: ShortcutService) {
  const nodes = []
  let current = node.rootNode()
  while (current) {
    nodes.push(stringifyNode(current))
    current = current.focusedChild()
  }
  return nodes.join(' -> ')
}
