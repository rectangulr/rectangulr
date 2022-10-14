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
exports.NativeClassesDirective = exports.ClassesDirective = void 0;
const core_1 = require("@angular/core");
const reactivity_1 = require("../../lib/reactivity");
const i0 = __importStar(require("@angular/core"));
/**
 *
 */
class ClassesDirective {
    constructor(element) {
        this.element = element;
        reactivity_1.onChange(this, 'newclasses', (classes) => {
            const enabledClasses = classes
                .map(item => {
                if (Array.isArray(item)) {
                    const [klass, condition] = item;
                    return condition ? klass : null;
                }
                else {
                    return item;
                }
            })
                .filter(t => t);
            const newStyle = {};
            enabledClasses.forEach(klass => {
                Object.entries(klass).forEach(([key, value]) => {
                    newStyle[key] = value;
                });
            });
            this.element.nativeElement.style.$;
        });
    }
}
exports.ClassesDirective = ClassesDirective;
ClassesDirective.ɵfac = function ClassesDirective_Factory(t) { return new (t || ClassesDirective)(i0.ɵɵdirectiveInject(i0.ElementRef)); };
ClassesDirective.ɵdir = i0.ɵɵdefineDirective({ type: ClassesDirective, selectors: [["", "newclasses", ""]], inputs: { newclasses: "newclasses" } });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ClassesDirective, [{
        type: core_1.Directive,
        args: [{
                selector: '[newclasses]',
            }]
    }], function () { return [{ type: i0.ElementRef }]; }, { newclasses: [{
            type: core_1.Input
        }] }); })();
/**
 *
 */
class NativeClassesDirective {
    constructor(element) {
        this.element = element;
        reactivity_1.onChange(this, 'classes', classes => {
            const enabledClasses = classes
                .map(item => {
                if (Array.isArray(item)) {
                    return item[1] ? item[0] : null;
                }
                else {
                    return item;
                }
            })
                .filter(t => t);
            this.element.nativeElement.classList.assign(enabledClasses);
        });
    }
}
exports.NativeClassesDirective = NativeClassesDirective;
NativeClassesDirective.ɵfac = function NativeClassesDirective_Factory(t) { return new (t || NativeClassesDirective)(i0.ɵɵdirectiveInject(i0.ElementRef)); };
NativeClassesDirective.ɵdir = i0.ɵɵdefineDirective({ type: NativeClassesDirective, selectors: [["", "classes", ""]], inputs: { classes: "classes" } });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(NativeClassesDirective, [{
        type: core_1.Directive,
        args: [{
                selector: '[classes]',
            }]
    }], function () { return [{ type: i0.ElementRef }]; }, { classes: [{
            type: core_1.Input
        }] }); })();
