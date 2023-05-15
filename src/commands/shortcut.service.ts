import { EventEmitter, Injectable, NgZone, Optional, SkipSelf } from '@angular/core'
import _ from 'lodash'
import { BehaviorSubject, Subject } from 'rxjs'
import { NiceView } from '../angular-terminal/debug'
import { Element } from '../angular-terminal/dom-terminal'
import { Logger } from '../angular-terminal/logger'
import { ScreenService } from '../angular-terminal/screen-service'
import { Destroyable } from '../utils/mixins'
import { makeObservable, onChange } from '../utils/reactivity'
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

  receivedCaretRequestRecently = false
  askedForFocusThisTick: { child: ShortcutService; source: ShortcutService; reason: string }[] = []
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
    @SkipSelf() @Optional() public parent: ShortcutService,
    public ngZone: NgZone
  ) {
    if (isRoot(this)) {
      this.rootNode = this
      this.isFocused = true
      this.isInFocusPath = true
      this.screen?.termScreen.addEventListener('keypress', key => this.incomingKey(key))
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
    //   // this.logger.log(`reset receivedFocusThisTick to ${this.receivedFocusThisTick}`)
    // })
  }

  incomingKey(keyEvent) {
    let key = keyEvent.key as unknown as Key
    // this.logger.log(`key: ${keyToString(key)}`)
    if (this.before) {
      key = this.before.propagateKeypress(key)
    }
    if (key) {
      const unhandledKeypress = this.propagateKeypress(key)
      if (unhandledKeypress) {
        this.logger.log(`unhandled keypress: ${keyToString(unhandledKeypress)}`)
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
        if (!unhandled) {
          // this.logger.log(`handle key: ${stringifyPathToNode(this)} - ${key}`)
        }
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
    let res = command.func(keys)
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
      // this.logger.log(`focused: ${stringifyPathToLeaf(this)}`)
      return
    }

    if (!args.child.focusIf) {
      // this.logger.log(`denied - ${args.child} - focusIf`)
      return
    }

    if (this.askedForFocusThisTick.find(item => item.child === args.child)) {
      // this.logger.log(`denied - ${args.child} - askedForFocusThisTick`)
      return
    }

    _.remove(this.focusStack, i => i == args.child)
    let index = this.focusStack.length
    if (args.soft) index -= this.askedForFocusThisTick.length
    index = _.clamp(index, 0, this.focusStack.length)
    const stackBefore = this.focusStack.map(i => i._id).join(',')
    this.focusStack.splice(index, 0, args.child)
    const stackAfter = this.focusStack.map(i => i._id).join(',')
    // this.logger.log(`${stringifyPathToNode(this)} : [${stackBefore}] ->  [${stackAfter}]`)

    this.askedForFocusThisTick.push({ child: args.child, reason: args.reason, source: args.source })
    this.focusedChild = _.last(this.focusStack)
    assert(this.focusedChild, 'should focus a child')
    // log('received')

    // this.logger.log('setTimeout')
    setTimeout(() => {
      this.askedForFocusThisTick = []
      // this.logger.log(`focused end of tick: ${stringifyPathToLeaf(this)}`)
    })

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
    child.isFocused = false
  })

  forEachChildInFocusPath(rootNode, (child: ShortcutService) => {
    child.isFocused = true
  })

  forFocusedChild(rootNode, child => {
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

  return simplifyShortcutService(rootKeybindService)
}

function simplifyShortcutService(shortcutService: ShortcutService) {
  let res = _.pick(shortcutService, ['commands', 'keybinds', 'children', '_id']) as any
  if (shortcutService.focusedChild) {
    res.focusedChild = simplifyShortcutService(shortcutService.focusedChild)
  }

  res.toString = () => {
    return stringifyNode(shortcutService)
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

function stringifyComponent(component: any) {
  const toString = component.toString()
  if (toString == '[object Object]') {
    return component.constructor.name
  } else {
    return toString
  }
}

function stringifyNode(shortcutService: ShortcutService) {
  let componentNames = Object.values(shortcutService.commands)
    .map(commands => _.last(commands))
    .filter(c => !!c && c.context)
    .map(command => stringifyComponent(command.context))
  componentNames = [...new Set(componentNames)]
  const componentNamesString = componentNames.join()

  return `${shortcutService._id} (${componentNamesString})`
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
