import { EventEmitter, Injectable, Optional, SkipSelf } from "@angular/core";
import _ from "lodash";
import { CommandsService } from "../commands/command-service";
import { Key } from "../commands/key-sequence";
import { Debug } from "../lib/debug";
import { Logger } from "../lib/logger";
import { Screen } from "../lib/screen-service";
import { Element } from "../mylittledom";
import { Destroyable } from "../utils/mixins";
import { onChange, onChangeEmit } from "../utils/reactivity";
import { moveToLast, remove } from "../utils/utils";

export interface Keybind {
  keys: string;
  func: (key: Key) => Key[] | void | Promise<Key[]> | Promise<void>;
}
export type MultiKeybind = Keybind & { keys: string[] };

let globalId = 0;

@Injectable({
  providedIn: "root",
})
export class KeybindService {
  _id = ++globalId;

  keybinds: { [x: string]: Function[] } = {};
  wildcard: Function[] = [];

  focusStack: KeybindService[] = [];
  focusedChild: KeybindService = null;
  children: KeybindService[] = [];
  components = [];
  rootNode: KeybindService = null;

  receivedFocusRequestRecently = false;
  receivedCaretRequestRecently = false;
  caretElement: Element = null;

  isFocused = false;
  isFocusedChanges = new EventEmitter<boolean>();
  isInFocusPath = false;
  isInFocusPathChanges = new EventEmitter<boolean>();

  before: KeybindService = null;

  constructor(
    public screen: Screen,
    public logger: Logger,
    public commandsService: CommandsService,
    @SkipSelf() @Optional() public parent: KeybindService
  ) {
    if (isRoot(this)) {
      this.rootNode = this;
      this.isFocused = true;
      this.isInFocusPath = true;
      this.screen.screen.addEventListener(
        "keypress",
        (keyEvent: KeyboardEvent) => {
          // this.logger.log(`key: ${keyToString(keyEvent.key as any)}`)

          let key = keyEvent.key as unknown as Key;
          if (this.before) {
            key = this.before.propagateKeypress(keyEvent.key);
          }
          if (key) {
            this.propagateKeypress(key);
          }
        }
      );
    } else {
      this.rootNode = this.parent.rootNode;
      this.parent.childCreated(this);
    }

    updateTree(this.rootNode);

    onChangeEmit(this, "isFocused", "isFocusedChanges");
    onChangeEmit(this, "isInFocusPath", "isInFocusPathChanges");
    onChange(this, "focusedChild", (value) => {
      updateTree(this.rootNode);
    });
  }

  /**
   *  Tell our parent that we're getting destroyed.
   */
  ngOnDestroy() {
    if (!this.parent) return;

    this.unfocus();
    this.parent.childDestroyed(this);
  }

  /**
   * Called by children to signal their creation.
   */
  childCreated(child: KeybindService) {
    this.children.push(child);
  }

  /**
   * Called by children to signal their destruction.
   */
  childDestroyed(child: KeybindService) {
    remove(this.focusStack, child);
    remove(this.children, child);
  }

  propagateKeypress(keypress): Key {
    if (depth(this) == 0) {
      // this.logger.log(`${padding(this)}keypress: ${keyToString(keypress)}`)
    }

    if (this.focusedChild) {
      const focusStack = `focusStack: [${this.focusStack
        .map((child) => "child")
        .join(",")}]`;
      const components = `components: [${this.components
        .map((c) => c.constructor.name)
        .join(",")}]`;
      const handlers = `handlers: [${Object.keys(this.keybinds)
        .filter((value) => value.length > 0)
        .join(",")}]`;
      // this.logger.log(`${padding(this)}${components}, ${handlers}, ${focusStack}`)

      const unhandledKeypress = this.focusedChild.propagateKeypress(keypress);

      if (unhandledKeypress) {
        return this.handleKeypress(unhandledKeypress);
      }
    } else {
      const unhandledKeypress = this.handleKeypress(keypress);
      if (unhandledKeypress && depth(this) == 0) {
        // this.logger.log(`unhandled keypress: ${keyToString(unhandledKeypress)}`)
      }
      return unhandledKeypress;
    }
  }

  private handleKeypress(keypress): Key {
    // Keybind
    const key = keyToString(keypress);
    const funcs = this.keybinds[key];
    if (funcs) {
      const lastFunc = _.last(funcs);
      if (lastFunc) {
        lastFunc?.(keypress);
        // this.logger.log(`${padding(this)}handler: ${lastFunc}`)
        return;
      } else {
        // this.logger.log(`${padding(this)}return: ${key}`)
        return keypress;
      }
    }

    // Else
    for (const func of this.wildcard) {
      const unhandledKeypress = func(keypress);
      // this.logger.log(`${padding(this)}else handler: ${func}`)
      if (unhandledKeypress) {
        keypress = unhandledKeypress;
      } else {
        return;
      }
    }

    return keypress;
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
  register({ keys, func }: Keybind) {
    // this.logger.log(`${padding(this)}register keys: ${keys}`)

    // Else
    if (keys == "else") {
      this.wildcard.push(func);
      return;
    }

    // Keybind
    this.keybinds[keys] ??= [];
    this.keybinds[keys].push(func);
  }

  registerCommand(commandBind: { id; keys; func }) {
    let command = this.commandsService.register(commandBind);
    this.register({
      ...commandBind,
      func: () => {
        this.commandsService.executeCommand({ id: command.id, args: null });
      },
    });
  }

  remove({ keys, func }) {
    // this.logger.log(`${padding(this)}remove keys: ${keys}`)

    const funcs = this.keybinds[keys];
    if (funcs) {
      remove(funcs, func);
      return;
    }

    if (keys == "else") {
      remove(this.wildcard, func);
    }
  }

  /**
   * After calling this, this KeybindService gets priority for handling a keypress.
   * If it doesn't know what to do with it, it can pass it to its parent.
   * Usually called after a user interaction.
   */
  focus(child?: KeybindService): boolean {
    // this.logger.log(`${padding(this)}focus`)

    // To be able to call focus() without arguments
    if (!child) {
      const granted = this.parent?.focus(this);
      if (granted) {
        this.screen.screen.activeElement = this.caretElement;
      }
      return granted;
    }

    let focusGranted: boolean;
    if (isRoot(this)) {
      focusGranted = true;
    } else {
      focusGranted = this.parent.focus(this);
    }
    if (focusGranted) {
      moveToLast(this.focusStack, child);
      this.focusedChild = _.last(this.focusStack);
    }
    return focusGranted;
  }

  /**
   * Remove itself from its parent's focus stack.
   */
  unfocus(child?: KeybindService) {
    // To be able to call unfocus() without arguments
    if (!child) {
      return this.parent?.unfocus(this);
    }

    remove(this.focusStack, child);
    this.focusedChild = _.last(this.focusStack);
  }

  /**
   * If multiple components request focus at the same time, the first one to request wins.
   * If the component should get focused not matter what, use `focus` instead.
   * Usually called inside `ngOnInit`.
   */
  requestFocus(child?: KeybindService): boolean {
    const receivedFocusRequestRecently = this.receivedFocusRequestRecently;
    this.receivedFocusRequestRecently = true;
    setTimeout(() => {
      this.receivedFocusRequestRecently = false;
    }, 0);

    // To be able to call requestFocus() without arguments
    if (!child) {
      if (isRoot(this)) {
        return true;
      } else {
        return this.parent?.requestFocus(this);
      }
    }

    if (receivedFocusRequestRecently) return false;

    moveToLast(this.focusStack, child);
    this.focusedChild = _.last(this.focusStack);
    return true;
  }

  /**
   * If multiple components request the caret at the same time, the first one to request wins.
   * Usually called inside `ngOnInit`.
   * */
  requestCaret(element) {
    const receivedCaretRequestRecently = this.receivedCaretRequestRecently;
    this.receivedCaretRequestRecently = true;
    setTimeout(() => {
      this.receivedCaretRequestRecently = false;
    }, 0);

    if (receivedCaretRequestRecently) return false;

    this.caretElement = element;
    updateTree(this.rootNode);
    return true;
  }
}

/**
 * Is this the root keybind service?
 */
function isRoot(keybindService: KeybindService) {
  return !keybindService.parent;
}

/**
 * Convert a keypress to a string.
 * Example: {ctrl: true, key: 'r'} => 'ctrl+r'
 */
export function keyToString(key: Key) {
  let res = [];
  if (key.ctrl) res.push("ctrl");
  if (key.alt) res.push("alt");
  if (key.shift) res.push("shift");
  if (key.meta) res.push("meta");
  if (key.name) res.push(key.name);
  return res.join("+");
}

/**
 * Register keybinds for the lifetime of the component
 */
export function registerKeybinds(
  component: Destroyable & { keybindService: KeybindService },
  keybinds: (Keybind | { keys: string[] })[]
) {
  moveToLast(component.keybindService.components, component);

  // Register
  {
    keybinds.forEach((keybind) => {
      if (typeof keybind.keys === "string") {
        component.keybindService.register(<Keybind>keybind);
      } else if (Array.isArray(keybind.keys)) {
        registerMultiKeybind(component, <MultiKeybind>keybind);
      }
    });
  }

  // Remove when destroyed
  {
    component.destroy$.subscribe(() => {
      keybinds.forEach((keybind) => {
        if (typeof keybind.keys === "string") {
          component.keybindService.remove(<Keybind>keybind);
        } else if (Array.isArray(keybind.keys)) {
          removeMultiKeybind(component, <MultiKeybind>keybind);
        }
      });

      remove(component.keybindService.components, component);
    });
  }
}

function registerMultiKeybind(
  component: Destroyable & { keybindService: KeybindService },
  multiKeybind: Keybind & { keys: string[] }
) {
  multiKeybind.keys.forEach((key) => {
    component.keybindService.register({ keys: key, func: multiKeybind.func });
  });
}

function removeMultiKeybind(
  component: Destroyable & { keybindService: KeybindService },
  multiKeybind: Keybind & { keys: string[] }
) {
  multiKeybind.keys.forEach((key) => {
    component.keybindService.remove({ keys: key, func: multiKeybind.func });
  });
}

function forEachChild(keybindService: KeybindService, func) {
  keybindService.children.forEach((child) => {
    func(child);
    forEachChild(child, func);
  });
}

function forEachChildInFocusPath(keybindService: KeybindService, func) {
  func(keybindService);
  if (keybindService.focusedChild) {
    forEachChildInFocusPath(keybindService.focusedChild, func);
  }
}

function forFocusedChild(keybindService: KeybindService, func) {
  if (keybindService.focusedChild) {
    forEachChildInFocusPath(keybindService.focusedChild, func);
  } else {
    func(keybindService);
  }
}

function updateTree(rootNode: KeybindService) {
  if (!isRoot(rootNode))
    throw new Error("should only be called on the keybind root");

  forEachChild(rootNode, (child) => {
    child.isFocused = false;
  });

  forEachChildInFocusPath(rootNode, (child: KeybindService) => {
    child.isFocused = true;
  });

  forFocusedChild(rootNode, (child) => {
    if (!child.focusedChild) {
      rootNode.screen.screen.activeElement = child.caretElement;
    }
  });
}

registerKeyDebug();

export function registerKeyDebug() {
  globalThis["ngtDebugKeybinds"] = ngtDebugKeybinds;
}

export function ngtDebugKeybinds() {
  const ng = globalThis.ngtDebug() as Debug;
  const rootKeybindService = ng.more.injector.get(KeybindService);
  return rootKeybindService;
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

export function padding(keybindService: KeybindService) {
  let spaces = "";
  for (let d = depth(keybindService); d > 0; d--) {
    spaces += "  ";
  }
  return `${keybindService._id} ${spaces}`;
}

export function depth(keybindService: KeybindService) {
  let depth = 0;
  while (true) {
    if (keybindService.parent) {
      depth++;
      keybindService = keybindService.parent;
    } else {
      return depth;
    }
  }
}
