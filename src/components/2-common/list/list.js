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
exports.ListItem = exports.TableObjectDisplay = exports.BasicObjectDisplay = exports.List = void 0;
const core_1 = require("@angular/core");
const json5 = __importStar(require("json5"));
const _ = __importStar(require("lodash"));
const ng_dynamic_component_1 = require("ng-dynamic-component");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const command_service_1 = require("../../../commands/command-service");
const dom_terminal_1 = require("../../../angular-terminal/dom-terminal");
const reactivity_1 = require("../../../lib/reactivity");
const utils_1 = require("../../../lib/utils");
const styles_1 = require("../styles");
const i0 = __importStar(require("@angular/core"));
const i1 = __importStar(require("../../../commands/command-service"));
const i2 = __importStar(require("@angular/common"));
const i3 = __importStar(require("../../1-basics/box"));
const i4 = __importStar(require("../../1-basics/style"));
const i5 = __importStar(require("../../1-basics/classes"));
const i6 = __importStar(require("ng-dynamic-component"));
const _c0 = ["listItem"];
const _c1 = ["elementRef"];
function List_box_0_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "box");
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance(1);
    i0.ɵɵtextInterpolate2("", ctx_r0.selected.index + 1, "/", (ctx_r0._items.value == null ? null : ctx_r0._items.value.length) || 0, "");
} }
function List_box_2_ng_container_2_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementContainer(0);
} }
const _c2 = function (a0) { return { object: a0 }; };
function List_box_2_ng_container_3_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementContainer(0, 6);
} if (rf & 2) {
    const item_r2 = i0.ɵɵnextContext().$implicit;
    const ctx_r6 = i0.ɵɵnextContext();
    i0.ɵɵproperty("ngComponentOutlet", ctx_r6._displayComponent)("ndcDynamicInputs", i0.ɵɵpureFunction1(2, _c2, item_r2));
} }
const _c3 = function (a0, a1) { return [a0, a1]; };
const _c4 = function (a0) { return { $implicit: a0 }; };
function List_box_2_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "box", 2, 3);
    i0.ɵɵtemplate(2, List_box_2_ng_container_2_Template, 1, 0, "ng-container", 4);
    i0.ɵɵtemplate(3, List_box_2_ng_container_3_Template, 1, 4, "ng-container", 5);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const item_r2 = ctx.$implicit;
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵproperty("classes", i0.ɵɵpureFunction2(7, _c3, ctx_r1.nullOnNull, i0.ɵɵpureFunction2(4, _c3, ctx_r1.whiteOnGray, item_r2 == ctx_r1.selected.value)));
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("ngTemplateOutlet", ctx_r1.itemTemplate)("ngTemplateOutletContext", i0.ɵɵpureFunction1(10, _c4, item_r2));
    i0.ɵɵadvance(1);
    i0.ɵɵproperty("ngIf", ctx_r1._displayComponent);
} }
const _c5 = function () { return { flexShrink: 0 }; };
const _c6 = function () { return { height: 1 }; };
/**
 * Display a list of items and highlight the current item.
 * Go up and down with the keyboard.
 */
class List {
    constructor(commandService, itemComponentInjected) {
        this.commandService = commandService;
        this.itemComponentInjected = itemComponentInjected;
        this.trackByFn = (index, item) => item;
        this.showIndex = false;
        this.selected = {
            index: 0,
            value: null,
        };
        this.commands = [
            {
                keys: 'down',
                func: () => {
                    this.selectIndex(this.selected.index + 1);
                },
            },
            {
                keys: 'up',
                func: () => {
                    this.selectIndex(this.selected.index - 1);
                },
            },
            {
                keys: 'pgup',
                func: () => {
                    this.selectIndex(0);
                },
            },
            {
                keys: 'pgdown',
                func: () => {
                    this.selectIndex(this._items.value.length - 1);
                },
            },
        ];
        this.windowSize = 20;
        this.createdRange = { start: 0, end: this.windowSize };
        this.createdRangeChanges = new rxjs_1.BehaviorSubject(null);
        this.createdItems = [];
        this.selectedItem = new rxjs_1.BehaviorSubject({ value: null, viewRef: null });
        this.whiteOnGray = styles_1.whiteOnGray;
        this.nullOnNull = dom_terminal_1.makeRuleset({ backgroundColor: null, color: null });
        this.destroy$ = new rxjs_1.Subject();
        this._items = new reactivity_1.State([], this.destroy$);
    }
    set items(items) {
        this._items.subscribeSource(items);
    }
    ngOnInit() {
        // The way the item is displayed can be customized via an Input, and Injected value, or defaults to a basic json stringify
        this._displayComponent =
            this.displayComponent ?? this.itemComponentInjected ?? BasicObjectDisplay;
        this.selectIndex(0);
        this._items.$.pipe(utils_1.filterNulls, operators_1.takeUntil(this.destroy$)).subscribe(() => {
            this.selectIndex(0);
        });
        command_service_1.registerCommands(this, this.commands);
        reactivity_1.onChangeEmit(this, 'createdRange', 'createdRangeChanges');
        rxjs_1.combineLatest([this._items.$.pipe(utils_1.filterNulls), this.createdRangeChanges])
            .pipe(operators_1.takeUntil(this.destroy$), operators_1.map(([items, createdRange]) => {
            return items.slice(createdRange.start, createdRange.end);
        }))
            .subscribe(createdItems => {
            var _a;
            this.createdItems = createdItems;
            this.stats = {};
            for (const item of createdItems) {
                for (const [key, value] of Object.entries(item)) {
                    (_a = this.stats)[key] ?? (_a[key] = { nb: 0, total: 0 });
                    this.stats[key].nb++;
                    this.stats[key].total += String(value).length;
                }
            }
        });
    }
    selectIndex(value) {
        if (!this._items.value || this._items.value.length == 0) {
            this.selectedItem.next({ value: null, viewRef: null });
            return;
        }
        this.selected.index = _.clamp(value, 0, this._items.value.length - 1);
        this.selected.value = this._items.value[this.selected.index];
        this.createdRange = rangeCenteredAroundIndex(this.selected.index, this.windowSize, this._items.value.length);
        this.selectedItem.next({ value: this.selected.value, viewRef: null });
        const afterIndexSelected = () => {
            const selectedComponent = this.componentRefs?.get(this.selected.index)?.componentRef
                .instance;
            selectedComponent?.commandService?.focus();
            if (this.elementRefs?.length > 0) {
                const element = this.elementRefs.get(this.selected.index - this.createdRange.start)?.nativeElement;
                element.scrollIntoView();
            }
        };
        setTimeout(afterIndexSelected, 0);
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
exports.List = List;
List.ɵfac = function List_Factory(t) { return new (t || List)(i0.ɵɵdirectiveInject(i1.CommandService, 4), i0.ɵɵdirectiveInject('itemComponent', 8)); };
List.ɵcmp = i0.ɵɵdefineComponent({ type: List, selectors: [["list"]], contentQueries: function List_ContentQueries(rf, ctx, dirIndex) { if (rf & 1) {
        i0.ɵɵcontentQuery(dirIndex, _c0, 1);
    } if (rf & 2) {
        let _t;
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.itemTemplate = _t.first);
    } }, viewQuery: function List_Query(rf, ctx) { if (rf & 1) {
        i0.ɵɵviewQuery(_c1, 5);
        i0.ɵɵviewQuery(ng_dynamic_component_1.ComponentOutletInjectorDirective, 5);
    } if (rf & 2) {
        let _t;
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.elementRefs = _t);
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.componentRefs = _t);
    } }, inputs: { displayComponent: "displayComponent", items: "items", trackByFn: "trackByFn", showIndex: "showIndex" }, outputs: { selectedItem: "selectedItem" }, decls: 3, vars: 6, consts: [[4, "ngIf"], [3, "classes", 4, "ngFor", "ngForOf", "ngForTrackBy"], [3, "classes"], ["elementRef", ""], [4, "ngTemplateOutlet", "ngTemplateOutletContext"], [3, "ngComponentOutlet", "ndcDynamicInputs", 4, "ngIf"], [3, "ngComponentOutlet", "ndcDynamicInputs"]], template: function List_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵtemplate(0, List_box_0_Template, 2, 2, "box", 0);
        i0.ɵɵelementStart(1, "box");
        i0.ɵɵtemplate(2, List_box_2_Template, 4, 12, "box", 1);
        i0.ɵɵelementEnd();
    } if (rf & 2) {
        i0.ɵɵproperty("ngIf", ctx.showIndex);
        i0.ɵɵadvance(1);
        i0.ɵɵstyleMap(i0.ɵɵpureFunction0(5, _c5));
        i0.ɵɵadvance(1);
        i0.ɵɵproperty("ngForOf", ctx.createdItems)("ngForTrackBy", ctx.trackByFn);
    } }, directives: [i2.NgIf, i3.Box, i4.StyleDirective, i2.NgForOf, i5.NativeClassesDirective, i2.NgTemplateOutlet, i2.NgComponentOutlet, i6.ComponentOutletInjectorDirective, i6.DynamicIoDirective], encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(List, [{
        type: core_1.Component,
        args: [{
                selector: 'list',
                template: `
    <box *ngIf="showIndex">{{ selected.index + 1 }}/{{ _items.value?.length || 0 }}</box>
    <box [style]="{ flexShrink: 0 }">
      <box
        #elementRef
        *ngFor="let item of createdItems; index as index; trackBy: trackByFn"
        [classes]="[nullOnNull, [whiteOnGray, item == selected.value]]">
        <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item }"></ng-container>
        <ng-container
          *ngIf="_displayComponent"
          [ngComponentOutlet]="_displayComponent"
          [ndcDynamicInputs]="{ object: item }"></ng-container>
      </box>
    </box>
  `,
            }]
    }], function () { return [{ type: i1.CommandService, decorators: [{
                type: core_1.SkipSelf
            }] }, { type: undefined, decorators: [{
                type: core_1.Inject,
                args: ['itemComponent']
            }, {
                type: core_1.Optional
            }] }]; }, { displayComponent: [{
            type: core_1.Input
        }], items: [{
            type: core_1.Input
        }], trackByFn: [{
            type: core_1.Input
        }], showIndex: [{
            type: core_1.Input
        }], itemTemplate: [{
            type: core_1.ContentChild,
            args: ['listItem']
        }], elementRefs: [{
            type: core_1.ViewChildren,
            args: ['elementRef', { emitDistinctChangesOnly: true }]
        }], componentRefs: [{
            type: core_1.ViewChildren,
            args: [ng_dynamic_component_1.ComponentOutletInjectorDirective, { emitDistinctChangesOnly: true }]
        }], selectedItem: [{
            type: core_1.Output
        }] }); })();
function rangeCenteredAroundIndex(index, rangeSize, length) {
    if (rangeSize < length) {
        let range = { start: index - rangeSize / 2, end: index + rangeSize / 2 };
        if (range.start < 0)
            return { start: 0, end: rangeSize };
        if (range.end > length) {
            return { start: length - rangeSize, end: length };
        }
        return clampRange(range, 0, length);
    }
    else {
        return { start: 0, end: length };
    }
}
function clampRange(range, min, max) {
    let newRange = _.clone(range);
    if (newRange.start < min)
        newRange.start = min;
    if (newRange.end > max)
        newRange.end = max;
    return newRange;
}
class BasicObjectDisplay {
    constructor(list) {
        this.list = list;
        this.excludeKeys = [];
        this.text = 'error';
    }
    ngOnInit() {
        const type = typeof this.object;
        if (this.object == null) {
            this.text = 'null';
        }
        else if (type == 'string' || type == 'number') {
            this.text = this.object;
        }
        else if (type == 'object') {
            this.includeKeys = this.includeKeys || Object.keys(this.object);
            if (this.object.name != undefined) {
                this.text = this.object.name;
            }
            else {
                const newObject = utils_1.mapKeyValue(this.object, (key, value) => {
                    if (this.includeKeys.includes(key)) {
                        if (!this.excludeKeys.includes(key)) {
                            // json can't contain bigint
                            if (typeof value == 'bigint') {
                                value = Number(value);
                            }
                            return [key, value];
                        }
                    }
                });
                this.text = json5.stringify(newObject);
            }
        }
        else {
            throw new Error(`can't display this`);
        }
    }
}
exports.BasicObjectDisplay = BasicObjectDisplay;
BasicObjectDisplay.ɵfac = function BasicObjectDisplay_Factory(t) { return new (t || BasicObjectDisplay)(i0.ɵɵdirectiveInject(List)); };
BasicObjectDisplay.ɵcmp = i0.ɵɵdefineComponent({ type: BasicObjectDisplay, selectors: [["ng-component"]], inputs: { object: "object", includeKeys: "includeKeys", excludeKeys: "excludeKeys" }, decls: 2, vars: 4, template: function BasicObjectDisplay_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵelementStart(0, "box");
        i0.ɵɵtext(1);
        i0.ɵɵelementEnd();
    } if (rf & 2) {
        i0.ɵɵstyleMap(i0.ɵɵpureFunction0(3, _c6));
        i0.ɵɵadvance(1);
        i0.ɵɵtextInterpolate(ctx.text);
    } }, directives: [i3.Box, i4.StyleDirective], encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(BasicObjectDisplay, [{
        type: core_1.Component,
        args: [{
                template: `<box [style]="{ height: 1 }">{{ text }}</box>`,
            }]
    }], function () { return [{ type: List }]; }, { object: [{
            type: core_1.Input
        }], includeKeys: [{
            type: core_1.Input
        }], excludeKeys: [{
            type: core_1.Input
        }] }); })();
class TableObjectDisplay {
    constructor(list) {
        this.list = list;
        this.excludeKeys = [];
        this.text = 'error';
        list.stats;
    }
    ngOnInit() {
        utils_1.assert(this.object);
        utils_1.assert(typeof this.object == 'object');
        utils_1.assert(this.list.stats);
        this.includeKeys = this.includeKeys || Object.keys(this.object);
        const newObject = utils_1.mapKeyValue(this.object, (key, value) => {
            if (this.includeKeys.includes(key)) {
                if (!this.excludeKeys.includes(key)) {
                    // json can't contain bigint
                    if (typeof value == 'bigint') {
                        value = Number(value);
                    }
                    return [key, value];
                }
            }
        });
        this.text = Object.entries(newObject)
            .map(([key, value]) => {
            const keyStats = this.list.stats[key];
            const averageLength = keyStats.total / keyStats.nb;
            return String(value).slice(0, averageLength);
        })
            .join('');
    }
}
exports.TableObjectDisplay = TableObjectDisplay;
TableObjectDisplay.ɵfac = function TableObjectDisplay_Factory(t) { return new (t || TableObjectDisplay)(i0.ɵɵdirectiveInject(List)); };
TableObjectDisplay.ɵcmp = i0.ɵɵdefineComponent({ type: TableObjectDisplay, selectors: [["ng-component"]], inputs: { object: "object", includeKeys: "includeKeys", excludeKeys: "excludeKeys" }, decls: 2, vars: 4, template: function TableObjectDisplay_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵelementStart(0, "box");
        i0.ɵɵtext(1);
        i0.ɵɵelementEnd();
    } if (rf & 2) {
        i0.ɵɵstyleMap(i0.ɵɵpureFunction0(3, _c6));
        i0.ɵɵadvance(1);
        i0.ɵɵtextInterpolate(ctx.text);
    } }, directives: [i3.Box, i4.StyleDirective], encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(TableObjectDisplay, [{
        type: core_1.Component,
        args: [{
                template: `<box [style]="{ height: 1 }">{{ text }}</box>`,
            }]
    }], function () { return [{ type: List }]; }, { object: [{
            type: core_1.Input
        }], includeKeys: [{
            type: core_1.Input
        }], excludeKeys: [{
            type: core_1.Input
        }] }); })();
class ListItem {
    constructor(list) {
        this.list = list;
    }
    static ngTemplateContextGuard(directive, context) {
        return true;
    }
}
exports.ListItem = ListItem;
ListItem.ɵfac = function ListItem_Factory(t) { return new (t || ListItem)(i0.ɵɵdirectiveInject(List)); };
ListItem.ɵdir = i0.ɵɵdefineDirective({ type: ListItem, selectors: [["", "listItem", ""]] });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ListItem, [{
        type: core_1.Directive,
        args: [{
                selector: '[listItem]',
            }]
    }], function () { return [{ type: List }]; }, null); })();
