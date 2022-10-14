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
exports.Screen = void 0;
const core_1 = require("@angular/core");
const dom_terminal_1 = require("./dom-terminal");
const elements_registry_1 = require("./elements-registry");
const i0 = __importStar(require("@angular/core"));
class Screen {
    constructor(ngZone) {
        this.ngZone = ngZone;
        this.screen = new dom_terminal_1.TermScreen({ debugPaintRects: false });
        {
            // Patch the stdout object, so that writing to it doesn't trigger another change detection.
            // Because that would create an infinite loop.
            const original_func = process.stdout.write;
            process.stdout.write = (...args) => {
                return this.ngZone.runOutsideAngular(() => {
                    return original_func.apply(process.stdout, args);
                });
            };
        }
        this.screen.attachScreen({
            stdin: process.stdin,
            stdout: process.stdout,
            trackOutputSize: true,
            throttleMouseMoveEvents: 1000 / 60,
        });
        globalThis['DOM'] = this.screen;
    }
    createElement(name, options = {}) {
        let elementFactory = elements_registry_1.elementsFactory.get(name);
        if (!elementFactory) {
            elementFactory = elements_registry_1.elementsFactory.get('box');
        }
        return new elementFactory(options);
    }
    selectRootElement() {
        return this.screen;
    }
}
exports.Screen = Screen;
Screen.ɵfac = function Screen_Factory(t) { return new (t || Screen)(i0.ɵɵinject(i0.NgZone)); };
Screen.ɵprov = i0.ɵɵdefineInjectable({ token: Screen, factory: Screen.ɵfac, providedIn: 'root' });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(Screen, [{
        type: core_1.Injectable,
        args: [{ providedIn: 'root' }]
    }], function () { return [{ type: i0.NgZone }]; }, null); })();
