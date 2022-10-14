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
exports.Box = void 0;
const core_1 = require("@angular/core");
const i0 = __importStar(require("@angular/core"));
/**
 * Empty definition. Just there for autocompletion and type checking from Angular.
 * This is handled by the dom-renderer.
 * @example
 * <box>Some text</box>
 */
class Box {
}
exports.Box = Box;
Box.ɵfac = function Box_Factory(t) { return new (t || Box)(); };
Box.ɵdir = i0.ɵɵdefineDirective({ type: Box, selectors: [["box"]] });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(Box, [{
        type: core_1.Directive,
        args: [{
                selector: 'box',
            }]
    }], null, null); })();
