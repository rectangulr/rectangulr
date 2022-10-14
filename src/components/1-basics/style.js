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
exports.StylesDirective = exports.StyleDirective = void 0;
const core_1 = require("@angular/core");
const reactivity_1 = require("../../lib/reactivity");
const i0 = __importStar(require("@angular/core"));
/**
 * Does nothing. Just there for autocompletion and type checking.
 * This behavior is handled by the renderer.
 * @example
 * <box [style]="{color: 'red'}">Some red text</box>
 */
class StyleDirective {
}
exports.StyleDirective = StyleDirective;
StyleDirective.ɵfac = function StyleDirective_Factory(t) { return new (t || StyleDirective)(); };
StyleDirective.ɵdir = i0.ɵɵdefineDirective({ type: StyleDirective, selectors: [["", "style", ""]], inputs: { style: "style" } });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(StyleDirective, [{
        type: core_1.Directive,
        args: [{
                selector: '[style]',
            }]
    }], null, { style: [{
            type: core_1.Input
        }] }); })();
/**
 * Does nothing. Just there for autocompletion and type checking.
 * This behavior is handled by the renderer.
 * @example
 * <box [styles]="{color: 'red'}">Some red text</box>
 */
class StylesDirective {
    constructor(element) {
        this.element = element;
        reactivity_1.onChange(this, 'styles', styles => {
            Object.entries(styles).forEach(([key, value]) => {
                this.element.nativeElement.style[key] = value;
            });
        });
    }
}
exports.StylesDirective = StylesDirective;
StylesDirective.ɵfac = function StylesDirective_Factory(t) { return new (t || StylesDirective)(i0.ɵɵdirectiveInject(i0.ElementRef)); };
StylesDirective.ɵdir = i0.ɵɵdefineDirective({ type: StylesDirective, selectors: [["", "styles", ""]], inputs: { styles: "styles" } });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(StylesDirective, [{
        type: core_1.Directive,
        args: [{
                selector: '[styles]',
            }]
    }], function () { return [{ type: i0.ElementRef }]; }, { styles: [{
            type: core_1.Input
        }] }); })();
