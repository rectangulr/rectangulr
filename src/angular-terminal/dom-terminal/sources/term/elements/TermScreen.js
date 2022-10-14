"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TermScreen = void 0;
const term_strings_1 = require("@manaflair/term-strings");
const parse_1 = require("@manaflair/term-strings/parse");
const core_decorators_1 = require("core-decorators");
const lodash_1 = require("lodash");
const core_1 = require("../../core");
const TermElement_1 = require("./TermElement");
// We will iterate through those colors when rendering if the debugPaintRects option is set
let DEBUG_COLORS = [`red`, `green`, `blue`, `magenta`, `yellow`], currentDebugColorIndex = 0;
class TermScreen extends TermElement_1.TermElement {
    constructor({ debugPaintRects = false, ...attributes } = {}) {
        super(attributes);
        this.handleStdoutResize = () => {
            let width = this.stdout.columns;
            let height = this.stdout.rows;
            this.style.assign({
                maxWidth: width,
                maxHeight: height,
                width: width,
                height: height,
            });
        };
        this.styleManager.addRuleset(core_1.makeRuleset({
            position: `relative`,
            width: 0,
            height: 0,
            overflow: `hidden`,
        }), core_1.StyleManager.RULESET_NATIVE);
        // We prevent this element from being set as child of another node
        Reflect.defineProperty(this, `parentNode`, {
            value: null,
            writable: false,
        });
        // We keep track of whether the screen is fully setup or not (has stdin/stdout)
        this.ready = false;
        // Input/output streams
        this.stdin = null;
        this.stdout = null;
        // Our subscription to the input events
        this.subscription = null;
        // A timer used to trigger layout / clipping / render updates after a node becomes dirty
        this.updateTimer = null;
        //
        this.trackOutputSize = false;
        //
        this.mouseOverElement = null;
        this.mouseEnterElements = [];
        // Bind the listeners that will convert the "mousemove" events into "mouseover" / "mouseout" / "mouseenter" / "mouseleave"
        this.addEventListener(`mousemove`, e => this.dispatchMouseOverEvents(e), { capture: true });
        this.addEventListener(`mousemove`, e => this.dispatchMouseEnterEvents(e), { capture: true });
        // Bind the listeners that enable navigating between focused elements
        this.addShortcutListener(`S-tab`, e => e.setDefault(() => this.focusPreviousElement()), {
            capture: true,
        });
        this.addShortcutListener(`tab`, e => e.setDefault(() => this.focusNextElement()), {
            capture: true,
        });
        // Bind the listener that exit the application on C-c
        this.addShortcutListener(`C-c`, e => this.terminate(), { capture: true });
        this.setPropertyTrigger(`debugPaintRects`, debugPaintRects, {
            validate: value => lodash_1.isBoolean(value),
            trigger: value => {
                this.queueDirtyRect();
            },
        });
    }
    requestUpdates() {
        if (this.updateTimer)
            return;
        this.updateTimer = setImmediate(() => {
            if (!this.ready)
                return;
            this.updateTimer = null;
            this.renderScreen();
        });
    }
    attachScreen({ stdin = process.stdin, stdout = process.stdout, trackOutputSize = true, throttleMouseMoveEvents = 1000 / 60, } = {}) {
        if (this.ready)
            throw new Error(`Failed to execute 'setup': This screen is already in use.`);
        if (lodash_1.isUndefined(stdin.read))
            throw new Error(`Failed to execute 'setup': The new stdin stream is not readable.`);
        if (lodash_1.isUndefined(stdin.write))
            throw new Error(`Failed to execute 'setup': The new stdout stream is not writable.`);
        if (lodash_1.isUndefined(stdout.columns) || lodash_1.isUndefined(stdout.rows))
            throw new Error(`Failed to execute 'setup': This output stream does not have columns and rows informations.`);
        this.ready = true;
        this.stdin = stdin;
        this.stdout = stdout;
        this.trackOutputSize = trackOutputSize;
        // Automatically clear the screen when the program exits
        // process.on(`uncaughtException`, this.handleException)
        // process.on(`exit`, this.handleExit)
        // Listen for input events
        this.subscription = parse_1.parseTerminalInputs(this.stdin, { throttleMouseMoveEvents }).subscribe({
            next: this.handleInput,
        });
        // Automatically resize the screen when its output changes
        if (this.trackOutputSize) {
            // this.style.assign({ width: this.stdout.columns, height: this.stdout.rows })
            this.stdout.on(`resize`, this.handleStdoutResize);
            this.handleStdoutResize();
        }
        // If we can operate in raw mode, we do
        if (this.stdin.setRawMode)
            this.stdin.setRawMode(true);
        // Enter the alternate screen
        this.stdout.write(term_strings_1.screen.alternateScreen.in);
        // Disable the terminal soft wrapping
        this.stdout.write(term_strings_1.screen.noWrap.in);
        // Hide the cursor (it will be renderer with everything else later)
        this.stdout.write(term_strings_1.cursor.hidden);
        // Enable mouse tracking (all events are tracked, even when the mouse button isn't pressed)
        this.stdout.write(term_strings_1.feature.enableMouseHoldTracking.in);
        this.stdout.write(term_strings_1.feature.enableMouseMoveTracking.in);
        this.stdout.write(term_strings_1.feature.enableExtendedCoordinates.in);
        // Clear the current font style so that we aren't polluted by previous applications
        this.stdout.write(term_strings_1.style.clear);
        // Finally schedule the first update of the screen
        this.requestUpdates();
    }
    releaseScreen() {
        if (!this.ready)
            return;
        // Disable the various mouse tracking modes
        this.stdout.write(term_strings_1.feature.enableExtendedCoordinates.out);
        this.stdout.write(term_strings_1.feature.enableMouseMoveTracking.out);
        this.stdout.write(term_strings_1.feature.enableMouseHoldTracking.out);
        // Display the cursor back
        this.stdout.write(term_strings_1.cursor.normal);
        // Exit the alternate screen
        this.stdout.write(term_strings_1.screen.alternateScreen.out);
        // Stop resizing the screen
        if (this.trackOutputSize) {
            // this.style.assign({ width: undefined, height: undefined })
            this.stdout.removeListener(`resize`, this.handleStdoutResize);
        }
        // Stop listening for events from the input stream
        this.subscription.unsubscribe();
        this.subscription = null;
        // Remove the exit hooks, since the screen is already closed
        process.removeListener(`uncaughtException`, this.handleException);
        process.removeListener(`exit`, this.handleExit);
        this.trackOutputSize = false;
        this.stdin = null;
        this.stdout = null;
        this.ready = false;
    }
    terminate() {
        if (typeof process === `undefined`)
            return;
        if (typeof process.exit === `undefined`)
            return;
        process.exit(0);
    }
    dispatchMouseOverEvents(e) {
        let targetElement = this.getElementAt(e.worldCoordinates);
        if (targetElement === this.mouseOverElement)
            return;
        if (this.mouseOverElement) {
            let event = new core_1.Event(`mouseout`);
            event.mouse = e.mouse;
            event.worldCoordinates = e.worldCoordinates;
            event.contentCoordinates = e.contentCoordinates;
            this.mouseOverElement.dispatchEvent(event);
        }
        this.mouseOverElement = targetElement;
        if (this.mouseOverElement) {
            let event = new core_1.Event(`mouseover`);
            event.mouse = e.mouse;
            event.worldCoordinates = e.worldCoordinates;
            event.contentCoordinates = e.contentCoordinates;
            this.mouseOverElement.dispatchEvent(event);
        }
    }
    dispatchMouseEnterEvents(e) {
        let targetElement = this.getElementAt(e.worldCoordinates);
        let index = this.mouseEnterElements.indexOf(targetElement);
        let removedElements = [];
        let addedElements = [];
        if (index !== -1) {
            removedElements = this.mouseEnterElements.splice(index + 1, this.mouseEnterElements.length);
        }
        else {
            let currentElement = targetElement;
            let currentIndex = index;
            while (currentElement && currentIndex === -1) {
                addedElements.unshift(currentElement);
                currentElement = currentElement.parentNode;
                currentIndex = this.mouseEnterElements.indexOf(currentElement);
            }
            if (currentElement) {
                removedElements = this.mouseEnterElements.splice(currentIndex + 1, this.mouseEnterElements.length);
            }
            else {
                removedElements = this.mouseEnterElements.splice(0, this.mouseEnterElements.length);
            }
        }
        this.mouseEnterElements = this.mouseEnterElements.concat(addedElements);
        for (let t = removedElements.length - 1; t >= 0; --t) {
            let event = new core_1.Event(`mouseleave`, { bubbles: false });
            event.mouse = e.mouse;
            event.worldCoordinates = e.worldCoordinates;
            event.contentCoordinates = e.contentCoordinates;
            removedElements[t].dispatchEvent(event);
        }
        for (let t = 0; t < addedElements.length; ++t) {
            let event = new core_1.Event(`mouseenter`, { bubbles: false });
            event.mouse = e.mouse;
            event.worldCoordinates = e.worldCoordinates;
            event.contentCoordinates = e.contentCoordinates;
            addedElements[t].dispatchEvent(event);
        }
    }
    getElementAt(position) {
        this.triggerUpdates();
        let { x, y } = position;
        for (let element of this.renderList) {
            if (!element.elementClipRect)
                continue;
            if (x < element.elementClipRect.x ||
                x >= element.elementClipRect.x + element.elementClipRect.width)
                continue;
            if (y < element.elementClipRect.y ||
                y >= element.elementClipRect.y + element.elementClipRect.height)
                continue;
            return element;
        }
        return null;
    }
    renderScreen() {
        this.triggerUpdates();
        this.renderScreenImpl(this.flushDirtyRects());
    }
    renderScreenImpl(dirtyRects = [this.elementClipRect]) {
        let buffer = term_strings_1.cursor.hidden;
        let debugColor = DEBUG_COLORS[currentDebugColorIndex];
        currentDebugColorIndex = (currentDebugColorIndex + 1) % DEBUG_COLORS.length;
        while (!lodash_1.isEmpty(dirtyRects)) {
            let dirtyRect = dirtyRects.shift();
            for (let element of this.renderList) {
                if (!element.elementClipRect)
                    continue;
                let intersection = core_1.Rect.getIntersectingRect(element.elementClipRect, dirtyRect);
                if (!intersection)
                    continue;
                let truncation = dirtyRect.excludeRect(intersection);
                dirtyRects = truncation.concat(dirtyRects);
                for (let y = 0, Y = intersection.height; y < Y; ++y) {
                    let relativeX = intersection.x - element.elementWorldRect.x;
                    let relativeY = intersection.y - element.elementWorldRect.y + y;
                    let line = String(element.renderElement(relativeX, relativeY, intersection.width));
                    if (this.debugPaintRects)
                        line = term_strings_1.style.color.back(debugColor).in + line + term_strings_1.style.clear;
                    buffer += term_strings_1.cursor.moveTo({ x: intersection.x, y: intersection.y + y });
                    buffer += line;
                }
                break;
            }
        }
        // if (this.activeElement?.caret) {
        //   let x =
        //     this.activeElement.contentWorldRect.x -
        //     this.activeElement.scrollRect.x +
        //     this.activeElement.caret.x
        //   let y =
        //     this.activeElement.contentWorldRect.y -
        //     this.activeElement.scrollRect.y +
        //     this.activeElement.caret.y
        //   buffer += cursor.moveTo({ x, y })
        //   buffer += cursor.normal
        // }
        if (this.activeElement && this.activeElement.contentClipRect && this.activeElement.caret) {
            let x = this.activeElement.contentWorldRect.x -
                this.activeElement.scrollRect.x +
                this.activeElement.caret.x;
            let y = this.activeElement.contentWorldRect.y -
                this.activeElement.scrollRect.y +
                this.activeElement.caret.y;
            if (x >= this.activeElement.contentClipRect.x &&
                x < this.activeElement.contentClipRect.x + this.activeElement.contentClipRect.width &&
                y >= this.activeElement.contentClipRect.y &&
                y < this.activeElement.contentClipRect.y + this.activeElement.contentClipRect.height) {
                let visibleElement = this.getElementAt(new core_1.Point({ x, y }));
                if (visibleElement === this.activeElement) {
                    buffer += term_strings_1.cursor.moveTo({ x, y });
                    buffer += term_strings_1.cursor.normal;
                }
            }
        }
        this.stdout.write(buffer);
    }
    handleException(exception) {
        this.releaseScreen();
        process.stderr.write(exception.stack);
        process.exit(1);
    }
    handleExit() {
        this.releaseScreen();
    }
    handleInput(input) {
        if (input instanceof parse_1.Key) {
            let event = new core_1.Event(`keypress`, { cancelable: true, bubbles: true });
            event.key = input;
            // log(`handleInput: ${keyToString(input)}`)
            // if (this.activeElement) {
            //     this.activeElement.dispatchEvent(event)
            // } else {
            this.dispatchEvent(event);
            // }
        }
        else if (input instanceof parse_1.Mouse) {
            let worldCoordinates = new core_1.Point({ x: input.x, y: input.y });
            let targetElement = this.getElementAt(worldCoordinates);
            if (!targetElement)
                return; // Some envs (xterm.js) sometimes send mouse coordinates outside of the possible range
            let contentCoordinates = new core_1.Point({
                x: worldCoordinates.x - targetElement.contentWorldRect.x,
                y: worldCoordinates.y - targetElement.contentWorldRect.y + targetElement.scrollTop,
            });
            if (input.name === `wheel`) {
                let event = new core_1.Event(`mousewheel`, { bubbles: true });
                event.mouse = input;
                event.worldCoordinates = worldCoordinates;
                event.contentCoordinates = contentCoordinates;
                targetElement.dispatchEvent(event);
            }
            else {
                if (input.start) {
                    let event = new core_1.Event(`mousedown`, { cancelable: true, bubbles: true });
                    event.mouse = input;
                    event.worldCoordinates = worldCoordinates;
                    event.contentCoordinates = contentCoordinates;
                    targetElement.dispatchEvent(event);
                }
                if (input.end) {
                    let event = new core_1.Event(`mouseup`, { cancelable: true, bubbles: true });
                    event.mouse = input;
                    event.worldCoordinates = worldCoordinates;
                    event.contentCoordinates = contentCoordinates;
                    targetElement.dispatchEvent(event);
                }
                if (!input.start && !input.end) {
                    let event = new core_1.Event(`mousemove`, { cancelable: true, bubbles: true });
                    event.mouse = input;
                    event.worldCoordinates = worldCoordinates;
                    event.contentCoordinates = contentCoordinates;
                    targetElement.dispatchEvent(event);
                }
            }
        }
        else if (input instanceof Buffer) {
            let asString = input.toString();
            let emitData = () => {
                let event = new core_1.Event(`data`, { cancelable: true });
                event.buffer = input;
                if (this.activeElement) {
                    this.activeElement.dispatchEvent(event);
                }
                else {
                    this.dispatchEvent(event);
                }
            };
            if (asString.length === 1) {
                let event = new core_1.Event(`keypress`, { cancelable: true, bubbles: true });
                event.key = new parse_1.Key(asString);
                // log(`handleInput: ${keyToString(event.key)}`)
                event.setDefault(() => {
                    emitData();
                });
                if (this.activeElement) {
                    this.activeElement.dispatchEvent(event);
                }
                else {
                    this.dispatchEvent(event);
                }
            }
            else {
                emitData();
            }
        }
    }
}
__decorate([
    core_decorators_1.autobind
], TermScreen.prototype, "handleException", null);
__decorate([
    core_decorators_1.autobind
], TermScreen.prototype, "handleExit", null);
__decorate([
    core_decorators_1.autobind
], TermScreen.prototype, "handleInput", null);
exports.TermScreen = TermScreen;
