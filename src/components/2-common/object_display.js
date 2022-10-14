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
exports.ObjectDisplay = void 0;
const core_1 = require("@angular/core");
const json5 = __importStar(require("json5"));
const _ = __importStar(require("lodash"));
const rxjs_1 = require("rxjs");
const reactivity_1 = require("../../lib/reactivity");
const utils_1 = require("../../lib/utils");
const styles_1 = require("./styles");
const i0 = __importStar(require("@angular/core"));
const i1 = __importStar(require("../../angular-terminal/logger"));
const i2 = __importStar(require("@angular/common"));
const i3 = __importStar(require("../1-basics/box"));
const i4 = __importStar(require("../1-basics/style"));
const i5 = __importStar(require("../1-basics/classes"));
const _c0 = function () { return { flexDirection: "row" }; };
const _c1 = function (a0) { return { width: a0 }; };
const _c2 = function (a0) { return [a0]; };
function ObjectDisplay_box_0_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "box");
    i0.ɵɵelementStart(1, "box", 1);
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "box");
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const keyValue_r1 = ctx.$implicit;
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵstyleMap(i0.ɵɵpureFunction0(7, _c0));
    i0.ɵɵadvance(1);
    i0.ɵɵstyleMap(i0.ɵɵpureFunction1(8, _c1, ctx_r0.longestKey + 1));
    i0.ɵɵproperty("classes", i0.ɵɵpureFunction1(10, _c2, ctx_r0.blackOnWhite));
    i0.ɵɵadvance(1);
    i0.ɵɵtextInterpolate(keyValue_r1.key);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(keyValue_r1.value);
} }
class ObjectDisplay {
    constructor(logger) {
        this.logger = logger;
        this.longestKey = 0;
        this.blackOnWhite = styles_1.blackOnWhite;
        this.destroy$ = new rxjs_1.Subject();
        this._object = new reactivity_1.State('', this.destroy$);
        this._object.$.subscribe(object => {
            if (!object) {
                object = {};
            }
            this.keyValues = Object.entries(object).map(([key, value]) => {
                if (_.isPlainObject(value)) {
                    return { key, value: json5.stringify(value) };
                }
                return { key, value };
            });
            this.longestKey = utils_1.longest(this.keyValues);
        });
    }
    set object(object) {
        this._object.subscribeSource(object);
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
exports.ObjectDisplay = ObjectDisplay;
ObjectDisplay.ɵfac = function ObjectDisplay_Factory(t) { return new (t || ObjectDisplay)(i0.ɵɵdirectiveInject(i1.Logger)); };
ObjectDisplay.ɵcmp = i0.ɵɵdefineComponent({ type: ObjectDisplay, selectors: [["object-display"]], inputs: { object: "object" }, decls: 1, vars: 1, consts: [[3, "style", 4, "ngFor", "ngForOf"], [3, "classes"]], template: function ObjectDisplay_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵtemplate(0, ObjectDisplay_box_0_Template, 5, 12, "box", 0);
    } if (rf & 2) {
        i0.ɵɵproperty("ngForOf", ctx.keyValues);
    } }, directives: [i2.NgForOf, i3.Box, i4.StyleDirective, i5.NativeClassesDirective], encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ObjectDisplay, [{
        type: core_1.Component,
        args: [{
                selector: 'object-display',
                template: `
    <box [style]="{ flexDirection: 'row' }" *ngFor="let keyValue of keyValues">
      <box [style]="{ width: longestKey + 1 }" [classes]="[blackOnWhite]">{{ keyValue.key }}</box>
      <box>{{ keyValue.value }}</box>
    </box>
  `,
            }]
    }], function () { return [{ type: i1.Logger }]; }, { object: [{
            type: core_1.Input
        }] }); })();
