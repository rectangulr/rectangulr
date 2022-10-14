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
exports.ViewSwitcher = void 0;
const core_1 = require("@angular/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const dom_terminal_1 = require("../../../angular-terminal/dom-terminal");
const styles_1 = require("../styles");
const view_switcher_service_1 = require("./view_switcher.service");
const i0 = __importStar(require("@angular/core"));
const i1 = __importStar(require("./view_switcher.service"));
const i2 = __importStar(require("../../1-basics/box"));
const i3 = __importStar(require("@angular/common"));
const i4 = __importStar(require("ng-dynamic-component"));
const i5 = __importStar(require("../../1-basics/style"));
const i6 = __importStar(require("../../1-basics/classes"));
const _c0 = function () { return { marginRight: 1 }; };
const _c1 = function (a0, a1) { return [a0, a1]; };
function ViewSwitcher_box_3_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "box", 2);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const view_r1 = ctx.$implicit;
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵstyleMap(i0.ɵɵpureFunction0(4, _c0));
    i0.ɵɵproperty("classes", i0.ɵɵpureFunction2(8, _c1, ctx_r0.nullOnNull, i0.ɵɵpureFunction2(5, _c1, ctx_r0.whiteOnGray, view_r1 == ctx_r0.currentView)));
    i0.ɵɵadvance(1);
    i0.ɵɵtextInterpolate(view_r1.name);
} }
const _c2 = function () { return { flexGrow: 1 }; };
const _c3 = function () { return { flexDirection: "row", flexShrink: 0 }; };
class ViewSwitcher {
    constructor(viewService) {
        this.viewService = viewService;
        this.currentView = null;
        this.focusEmitters = null;
        this.whiteOnGray = styles_1.whiteOnGray;
        this.nullOnNull = dom_terminal_1.makeRuleset({ backgroundColor: null, color: null });
        this.destroy$ = new rxjs_1.Subject();
        this.focusEmitters = new WeakMap();
        this.viewService.views.forEach(view => {
            this.focusEmitters.set(view, new rxjs_1.ReplaySubject(1));
        });
        this.viewService.$currentView.pipe(operators_1.takeUntil(this.destroy$)).subscribe(currentView => {
            this.currentView = currentView;
            this.focusEmitters.get(currentView).next();
        });
    }
    ngAfterViewInit() {
        this.focusEmitters.get(this.currentView).next(true);
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
exports.ViewSwitcher = ViewSwitcher;
ViewSwitcher.ɵfac = function ViewSwitcher_Factory(t) { return new (t || ViewSwitcher)(i0.ɵɵdirectiveInject(view_switcher_service_1.ViewSwitcherService)); };
ViewSwitcher.ɵcmp = i0.ɵɵdefineComponent({ type: ViewSwitcher, selectors: [["view-switcher"]], decls: 4, vars: 8, consts: [[3, "ngComponentOutlet"], [3, "style", "classes", 4, "ngFor", "ngForOf"], [3, "classes"]], template: function ViewSwitcher_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵelement(0, "box", 0);
        i0.ɵɵelement(1, "box");
        i0.ɵɵelementStart(2, "box");
        i0.ɵɵtemplate(3, ViewSwitcher_box_3_Template, 2, 11, "box", 1);
        i0.ɵɵelementEnd();
    } if (rf & 2) {
        i0.ɵɵproperty("ngComponentOutlet", ctx.currentView.component);
        i0.ɵɵadvance(1);
        i0.ɵɵstyleMap(i0.ɵɵpureFunction0(6, _c2));
        i0.ɵɵadvance(1);
        i0.ɵɵstyleMap(i0.ɵɵpureFunction0(7, _c3));
        i0.ɵɵadvance(1);
        i0.ɵɵproperty("ngForOf", ctx.viewService.views);
    } }, directives: [i2.Box, i3.NgComponentOutlet, i4.ComponentOutletInjectorDirective, i5.StyleDirective, i3.NgForOf, i6.NativeClassesDirective], encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ViewSwitcher, [{
        type: core_1.Component,
        args: [{
                selector: 'view-switcher',
                template: `
    <box [ngComponentOutlet]="currentView.component"></box>
    <!-- <box
      *ngFor="let view of viewService.views"
      [style]="{ display: currentView == view ? 'flex' : 'none' }"
      [focusSeparate]="focusEmitters.get(view)">
      <ng-container [ngComponentOutlet]="view.component"></ng-container>
    </box> -->

    <box [style]="{ flexGrow: 1 }"></box>

    <box [style]="{ flexDirection: 'row', flexShrink: 0 }">
      <box
        [style]="{ marginRight: 1 }"
        *ngFor="let view of viewService.views"
        [classes]="[nullOnNull, [whiteOnGray, view == currentView]]"
        >{{ view.name }}</box
      >
    </box>
  `,
            }]
    }], function () { return [{ type: i1.ViewSwitcherService, decorators: [{
                type: core_1.Inject,
                args: [view_switcher_service_1.ViewSwitcherService]
            }] }]; }, null); })();
