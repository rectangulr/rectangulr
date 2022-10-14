"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.depth = exports.padding = exports.rgDebugKeybinds = exports.registerCommands = exports.keyToString = exports.CommandService = void 0;
const core_1 = require("@angular/core");
const _ = __importStar(require("lodash"));
const rxjs_1 = require("rxjs");
const reactivity_1 = require("../lib/reactivity");
const utils_1 = require("../lib/utils");
const disposable_1 = require("./disposable");
const i0 = __importStar(require("@angular/core"));
const i1 = __importStar(require("../angular-terminal/screen-service"));
const i2 = __importStar(require("../angular-terminal/logger"));
let globalId = 0;
class CommandService {
    constructor(elementRef, screen, logger, parent) {
        this.elementRef = elementRef;
        this.screen = screen;
        this.logger = logger;
        this.parent = parent;
        this._id = ++globalId;
        /**
         * Commands are stored by `id`. An `id` can have multiple commands.
         * This allows components to declare the same `id` without conflict, the latest command is used.
         * When the second component is destroyed the first command can be restored.
         */
        this.commands = {};
        this.commandsChange = new rxjs_1.BehaviorSubject(null);
        /**
         * Links a key (ex: ctrl+r) with a command id (ex: reload)
         */
        this.keybinds = {};
        this.focusStack = [];
        this.focusedChild = null;
        this.children = [];
        this.components = [];
        this.rootNode = null;
        this.receivedFocusRequestRecently = false;
        this.receivedCaretRequestRecently = false;
        this.caretElement = null;
        this.isFocused = false;
        this.isFocusedChange = new core_1.EventEmitter();
        this.isInFocusPath = false;
        this.isInFocusPathChange = new core_1.EventEmitter();
        this.before = null;
        if (isRoot(this)) {
            this.rootNode = this;
            this.isFocused = true;
            this.isInFocusPath = true;
            this.screen.screen.addEventListener('keypress', (keyEvent) => {
                // this.logger.log(`key: ${keyToString(keyEvent.key as any)}`)
                let key = keyEvent.key;
                if (this.before) {
                    key = this.before.propagateKeypress(keyEvent.key);
                }
                if (key) {
                    const unhandledKeypress = this.propagateKeypress(key);
                    if (unhandledKeypress) {
                        this.logger.log(`unhandled keypress: ${keyToString(unhandledKeypress)}`);
                    }
                }
            });
        }
        else {
            this.rootNode = this.parent.rootNode;
            this.parent.childCreated(this);
        }
        updateTree(this.rootNode);
        reactivity_1.onChangeEmit(this, 'isFocused', 'isFocusedChange');
        reactivity_1.onChangeEmit(this, 'isInFocusPath', 'isInFocusPathChange');
        reactivity_1.onChangeEmit(this, 'commands', 'commandsChange');
        reactivity_1.onChange(this, 'focusedChild', value => {
            updateTree(this.rootNode);
        });
    }
    propagateKeypress(keypress) {
        if (this.focusedChild) {
            const focusStack = `focusStack: [${this.focusStack.map(child => 'child').join(',')}]`;
            const components = `components: [${this.components.map(c => c.constructor.name).join(',')}]`;
            const handlers = `handlers: [${Object.keys(this.keybinds)
                .filter(value => value.length > 0)
                .join(',')}]`;
            // this.logger.log(`${padding(this)}${components}, ${handlers}, ${focusStack}`)
            const unhandledKeypress = this.focusedChild.propagateKeypress(keypress);
            if (unhandledKeypress) {
                return this.handleKeypress(unhandledKeypress);
            }
        }
        else {
            return this.handleKeypress(keypress);
        }
    }
    handleKeypress(keypress) {
        // Keybind
        const key = keyToString(keypress);
        const ids = this.keybinds[key] || this.keybinds['else'];
        if (ids) {
            const lastId = _.last(ids);
            if (lastId) {
                const unhandled = this.callCommand({ id: lastId, keys: keypress });
                return unhandled;
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
    registerCommand(_command) {
        var _a, _b, _c;
        const command = sanitizeCommand(_command);
        (_a = this.commands)[_b = command.id] ?? (_a[_b] = []);
        this.commands[command.id].push(command);
        for (const key of command.keys) {
            (_c = this.keybinds)[key] ?? (_c[key] = []);
            this.keybinds[key].push(command.id);
        }
        return new disposable_1.Disposable(() => {
            this.removeCommand(command);
        });
    }
    removeCommand(command) {
        utils_1.removeLastMatch(this.commands[command.id], command);
        for (const keys of command.keys) {
            utils_1.removeLastMatch(this.keybinds[keys], command.id);
        }
    }
    callCommand(arg) {
        const { id, keys, args } = arg;
        const command = retrieveLast(this.commands, id);
        if (!command) {
            throw new Error(`command '${id}' not found`);
        }
        const res = command.func(keys);
        return res;
    }
    /**
     * After calling this, this KeybindService gets priority for handling a keypress.
     * If it doesn't know what to do with it, it can pass it to its parent.
     * Usually called after a user interaction.
     */
    focus(child) {
        // To be able to call requestFocus() without arguments
        if (!child) {
            return this.parent?.focus(this);
        }
        let granted = false;
        if (isRoot(this)) {
            granted = true;
        }
        else {
            granted = this.parent?.focus(this);
        }
        if (granted) {
            utils_1.moveToLast(this.focusStack, child);
            this.focusedChild = _.last(this.focusStack);
        }
        return granted;
    }
    /**
     * Remove itself from its parent's focus stack.
     */
    unfocus(child) {
        // To be able to call unfocus() without arguments
        if (!child) {
            return this.parent?.unfocus(this);
        }
        utils_1.remove(this.focusStack, child);
        this.focusedChild = _.last(this.focusStack);
    }
    /**
     * If multiple components request focus at the same time, the first one to request wins.
     * Usually called inside `ngOnInit`.
     * If the component should get focused not matter what, use `focus` instead.
     */
    requestFocus(child) {
        const receivedFocusRequestRecently = this.receivedFocusRequestRecently;
        this.receivedFocusRequestRecently = true;
        setTimeout(() => {
            this.receivedFocusRequestRecently = false;
        }, 0);
        if (receivedFocusRequestRecently)
            return false;
        // To be able to call requestFocus() without arguments
        if (!child) {
            return this.parent?.focus(this);
        }
        let granted = false;
        if (isRoot(this)) {
            granted = true;
        }
        else {
            granted = this.parent?.focus(this);
        }
        if (granted) {
            utils_1.moveToLast(this.focusStack, child);
            this.focusedChild = _.last(this.focusStack);
        }
        return granted;
    }
    /**
     * If multiple components request the caret at the same time, the first one to request wins.
     * Usually called inside `ngOnInit`.
     */
    requestCaret(element) {
        const receivedCaretRequestRecently = this.receivedCaretRequestRecently;
        this.receivedCaretRequestRecently = true;
        setTimeout(() => {
            this.receivedCaretRequestRecently = false;
        }, 0);
        if (receivedCaretRequestRecently)
            return false;
        this.caretElement = element;
        updateTree(this.rootNode);
        return true;
    }
    /**
     *  Tell our parent that we're getting destroyed.
     */
    ngOnDestroy() {
        if (this.parent) {
            this.unfocus();
            this.parent.childDestroyed(this);
        }
    }
    /**
     * Called by children to signal their creation.
     */
    childCreated(child) {
        this.children.push(child);
    }
    /**
     * Called by children to signal their destruction.
     */
    childDestroyed(child) {
        utils_1.remove(this.focusStack, child);
        utils_1.remove(this.children, child);
    }
}
exports.CommandService = CommandService;
CommandService.ɵfac = function CommandService_Factory(t) { return new (t || CommandService)(i0.ɵɵinject(i0.ElementRef, 8), i0.ɵɵinject(i1.Screen), i0.ɵɵinject(i2.Logger), i0.ɵɵinject(CommandService, 12)); };
CommandService.ɵprov = i0.ɵɵdefineInjectable({ token: CommandService, factory: CommandService.ɵfac, providedIn: 'root' });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(CommandService, [{
        type: core_1.Injectable,
        args: [{
                providedIn: 'root',
            }]
    }], function () { return [{ type: i0.ElementRef, decorators: [{
                type: core_1.Optional
            }] }, { type: i1.Screen }, { type: i2.Logger }, { type: CommandService, decorators: [{
                type: core_1.SkipSelf
            }, {
                type: core_1.Optional
            }] }]; }, null); })();
function retrieveLast(map, id) {
    const items = map[id];
    if (!items)
        return undefined;
    return utils_1.last(items);
}
function sanitizeCommand(_command) {
    let command = { ..._command };
    if (typeof _command.keys == 'string') {
        command.keys = [_command.keys];
    }
    if (!_command.id) {
        command.id = command.keys[0];
    }
    // @ts-ignore
    return command;
}
/**
 * Is this the root keybind service?
 */
function isRoot(commandService) {
    return !commandService.parent;
}
/**
 * Convert a keypress to a string.
 * Example: {ctrl: true, key: 'r'} => 'ctrl+r'
 */
function keyToString(key) {
    let res = [];
    if (key.ctrl)
        res.push('ctrl');
    if (key.alt)
        res.push('alt');
    if (key.shift)
        res.push('shift');
    if (key.meta)
        res.push('meta');
    if (key.name)
        res.push(key.name);
    return res.join('+');
}
exports.keyToString = keyToString;
/**
 * Register keybinds for the lifetime of the component
 */
function registerCommands(component, commands) {
    const disposables = commands.map(command => {
        return component.commandService.registerCommand(command);
    });
    component.destroy$.subscribe(() => {
        disposable_1.Disposable.from(...disposables).dispose();
    });
}
exports.registerCommands = registerCommands;
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
function forEachChild(commandService, func) {
    commandService.children.forEach(child => {
        func(child);
        forEachChild(child, func);
    });
}
function forEachChildInFocusPath(commandService, func) {
    func(commandService);
    if (commandService.focusedChild) {
        forEachChildInFocusPath(commandService.focusedChild, func);
    }
}
function forFocusedChild(commandService, func) {
    if (commandService.focusedChild) {
        forEachChildInFocusPath(commandService.focusedChild, func);
    }
    else {
        func(commandService);
    }
}
function updateTree(rootNode) {
    if (!isRoot(rootNode))
        throw new Error('should only be called on the keybind root');
    forEachChild(rootNode, child => {
        child.isFocused = false;
    });
    forEachChildInFocusPath(rootNode, (child) => {
        child.isFocused = true;
    });
    forFocusedChild(rootNode, child => {
        if (!child.focusedChild) {
            rootNode.screen.screen.activeElement = child.caretElement;
        }
    });
}
utils_1.addToGlobal({
    debug: {
        keybinds: rgDebugKeybinds,
    },
});
function rgDebugKeybinds() {
    const ng = globalThis.rg.debug.component();
    const rootKeybindService = ng.more.injector.get(CommandService);
    return simplifyCommandService(rootKeybindService);
}
exports.rgDebugKeybinds = rgDebugKeybinds;
function simplifyCommandService(commandService) {
    let res = _.pick(commandService, ['commands', 'keybinds', '_id']);
    if (commandService.focusedChild) {
        res.focusedChild = simplifyCommandService(commandService.focusedChild);
    }
    return res;
}
function padding(commandService) {
    let spaces = '';
    for (let d = depth(commandService); d > 0; d--) {
        spaces += '  ';
    }
    return `${commandService._id} ${spaces}`;
}
exports.padding = padding;
function depth(commandService) {
    let depth = 0;
    while (true) {
        if (commandService.parent) {
            depth++;
            commandService = commandService.parent;
        }
        else {
            return depth;
        }
    }
}
exports.depth = depth;
