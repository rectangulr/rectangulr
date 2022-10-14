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
exports.TerminalRenderer = exports.TerminalRendererFactory = void 0;
const core_1 = require("@angular/core");
const json5 = __importStar(require("json5"));
const _ = __importStar(require("lodash"));
const utils_1 = require("../lib/utils");
const i0 = __importStar(require("@angular/core"));
const i1 = __importStar(require("./screen-service"));
class TerminalRendererFactory {
    constructor(screen) {
        this.screen = screen;
        this.renderer = new TerminalRenderer(screen);
    }
    end() {
        // if (this.screen.screen.stdout) {
        this.screen.selectRootElement().renderScreen();
        // }
    }
    createRenderer(hostElement, type) {
        return this.renderer;
    }
}
exports.TerminalRendererFactory = TerminalRendererFactory;
TerminalRendererFactory.ɵfac = function TerminalRendererFactory_Factory(t) { return new (t || TerminalRendererFactory)(i0.ɵɵinject(i1.Screen)); };
TerminalRendererFactory.ɵprov = i0.ɵɵdefineInjectable({ token: TerminalRendererFactory, factory: TerminalRendererFactory.ɵfac, providedIn: 'root' });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(TerminalRendererFactory, [{
        type: core_1.Injectable,
        args: [{ providedIn: 'root' }]
    }], function () { return [{ type: i1.Screen }]; }, null); })();
class TerminalRenderer {
    constructor(screen) {
        this.screen = screen;
        this.destroyNode = null;
    }
    destroy() { }
    selectRootElement() {
        return this.screen.selectRootElement();
    }
    createElement(name, namespace) {
        return this.screen.createElement(name);
    }
    createComment(value) {
        const comment = this.screen.createElement('text');
        comment.style.display = 'none';
        comment.nodeName = 'TermComment';
        return comment;
    }
    createText(value) {
        const element = this.screen.createElement('text');
        element.textContent = value;
        return element;
    }
    appendChild(parent, newChild) {
        // log(`appendChild: ${serializeDOMNode(parent)} -> ${serializeDOMNode(newChild)}`);
        parent.appendChild(newChild);
    }
    insertBefore(parent, newChild, refChild) {
        // log(`insertBefore: ${serializeDOMNode(parent)} -> ${serializeDOMNode(newChild)},${serializeDOMNode(refChild)}`);
        parent.insertBefore(newChild, refChild);
    }
    removeChild(parent, oldChild) {
        // log(`removeChild: ${serializeDOMNode(parent)} -> ${JSON.stringify(simplifyViewTree(oldChild), null, 2)}`);
        parent.removeChild(oldChild);
    }
    listen(target, eventName, callback) {
        // target.addEventListener(eventName, callback)
        // return () => { target.removeListener(eventName, callback) }
        return () => { };
    }
    parentNode(node) {
        return node.parentNode;
    }
    nextSibling(node) {
        return node.nextSibling;
    }
    setValue(node, value) {
        // log(`setValue: ${serializeDOMNode(node)} -> "${value}"`);
        //@ts-ignore
        node.textContent = value;
    }
    setAttribute(el, name, value, namespace) {
        el[name] = value;
    }
    removeAttribute(el, name, namespace) {
        el[name] = null;
    }
    setProperty(el, name, value) {
        if (name == 'classes') {
            const enabledClasses = value
                .map(item => {
                if (Array.isArray(item)) {
                    return item[1] ? item[0] : null;
                }
                else {
                    return item;
                }
            })
                .filter(t => t);
            el.classList.assign(enabledClasses);
        }
        else {
            el[name] = value;
        }
    }
    setStyle(el, style, value, flags) {
        el.style[style] = value;
    }
    removeStyle(el, style, flags) {
        el.style[style] = null;
    }
    addClass(el, className) {
        // el.classList.add(className)
    }
    removeClass(el, className) {
        // el.classList.remove(className)
    }
}
exports.TerminalRenderer = TerminalRenderer;
function stringifyDomNode(node, options) {
    options = { parent: false, children: true, ...options };
    const cache = new Set();
    function _stringifyDomNode(node, cache, options) {
        let res = {};
        if (node.nodeName == 'TermText2' || node.nodeName == 'TermComment') {
            res.text = node.textContent;
        }
        res.infos = {};
        res.infos = utils_1.mergeDeep(res.infos, _.mapValues(_.pick(node.style.$, ['flexGrow', 'flexShrink', 'height']), i => i.serialize?.() ?? i));
        res.infos = utils_1.mergeDeep(res.infos, _.pick(node, ['elementRect', 'scrollRect']));
        res.ref = node;
        // Prevent infinite loop
        if (!cache.has(node)) {
            cache.add(node);
            if (options.children && node.childNodes.length > 0) {
                res.children = node.childNodes.map(n => {
                    return _stringifyDomNode(n, cache, options);
                });
            }
            if (options.parent && node.parentNode) {
                res.parent = _stringifyDomNode(node.parentNode, cache, options);
            }
        }
        res.toString = () => {
            return node.nodeName + ' #' + node.id + '  ' + json5.stringify(res.infos);
        };
        return res;
    }
    return _stringifyDomNode(node, cache, options);
}
function globalDebugDOM(node) {
    if (node) {
        return stringifyDomNode(node);
    }
    else {
        const rootNode = globalThis['DOM'];
        return stringifyDomNode(rootNode);
    }
}
function globalDebugDOMSearch(text) {
    const rootNode = globalThis['DOM'];
    let result = [];
    function searchRecursive(node, text, result) {
        if (node.nodeName == 'TermText2') {
            if (node.textContent.includes(text)) {
                result.push(node);
            }
        }
        for (const child of [...node.childNodes]) {
            searchRecursive(child, text, result);
        }
    }
    searchRecursive(rootNode, text, result);
    return result.map(node => stringifyDomNode(node, { parent: true }));
}
function globalDebugDOMSize(text) {
    const rootNode = globalThis['DOM'];
    let result = [];
    function searchRecursive(node, text, result) {
        if (node.elementRect.width != node.scrollRect.width ||
            node.elementRect.height != node.scrollRect.height) {
            result.push(node);
        }
        for (const child of [...node.childNodes]) {
            searchRecursive(child, text, result);
        }
    }
    searchRecursive(rootNode, text, result);
    return result.map(node => stringifyDomNode(node, { parent: true }));
}
utils_1.addToGlobal({
    debug: {
        dom: globalDebugDOM,
        domSearch: globalDebugDOMSearch,
        domSize: globalDebugDOMSize,
    },
});
