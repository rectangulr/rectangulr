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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchList = void 0;
const core_1 = require("@angular/core");
const fuse_js_1 = __importDefault(require("fuse.js"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const reactivity_1 = require("../../lib/reactivity");
const utils_1 = require("../../lib/utils");
const styles_1 = require("./styles");
const i0 = __importStar(require("@angular/core"));
const i1 = __importStar(require("../../angular-terminal/logger"));
const i2 = __importStar(require("../1-basics/box"));
const i3 = __importStar(require("../1-basics/style"));
const i4 = __importStar(require("@angular/common"));
const i5 = __importStar(require("./list/list"));
const i6 = __importStar(require("../1-basics/input"));
const i7 = __importStar(require("../../commands/focus"));
const _c0 = function () { return { backgroundColor: "gray", color: "white" }; };
function SearchList_tui_input_1_Template(rf, ctx) { if (rf & 1) {
    const _r2 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "tui-input", 2);
    i0.ɵɵlistener("textChange", function SearchList_tui_input_1_Template_tui_input_textChange_0_listener($event) { i0.ɵɵrestoreView(_r2); const ctx_r1 = i0.ɵɵnextContext(); return ctx_r1.searchTextChange.next($event); });
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵstyleMap(i0.ɵɵpureFunction0(4, _c0));
    i0.ɵɵproperty("text", ctx_r0.searchText)("focus", ctx_r0.focusInput);
} }
const _c1 = function () { return { flexDirection: "column" }; };
class SearchList {
    constructor(logger) {
        this.logger = logger;
        this.searchText = '';
        this.showIndex = false;
        this.searchKeys = [];
        this.trackByFn = (index, item) => item;
        this.searchInputVisible = true;
        this.focusInput = rxjs_1.NEVER;
        this.searchTextChange = new rxjs_1.BehaviorSubject(this.searchText);
        this.selectedItem = new rxjs_1.BehaviorSubject({ value: null, viewRef: null });
        this.searchEnabled = true;
        this.searchIndex = new fuse_js_1.default([], {
            keys: this.searchKeys,
        });
        this.borderTop = styles_1.borderTop;
        this.destroy$ = new rxjs_1.Subject();
        this._items = new reactivity_1.State([], this.destroy$);
        this.matchingItems = new reactivity_1.State([], this.destroy$);
    }
    set items(items) {
        this._items.subscribeSource(items);
    }
    ngOnInit() {
        this._items.$.pipe(utils_1.filterNulls, operators_1.takeUntil(this.destroy$)).subscribe(items => {
            if (items.length <= 0) {
                this.searchEnabled = false;
                this.searchIndex = new fuse_js_1.default([]);
                return;
            }
            if (items.length > 20000) {
                this.searchEnabled = false;
                this.searchIndex = new fuse_js_1.default([]);
                this.searchText = 'search disabled. list too long';
                return;
            }
            this.searchEnabled = true;
            this.searchKeys = [];
            const firstItem = items[0];
            Object.entries(firstItem).forEach(([key, value]) => {
                if (['string', 'number'].includes(typeof value)) {
                    this.searchKeys.push(key);
                }
            });
            this.searchIndex = new fuse_js_1.default(items, { keys: this.searchKeys });
        });
        this.matchingItems.subscribeSource(rxjs_1.combineLatest([this._items.$, this.searchTextChange]).pipe(operators_1.debounceTime(100), operators_1.map(([items, searchText]) => {
            if (this.searchEnabled && searchText && searchText.length >= 2) {
                return this.searchIndex.search(searchText).map(result => result.item);
            }
            else {
                return items;
            }
        })));
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
exports.SearchList = SearchList;
SearchList.ɵfac = function SearchList_Factory(t) { return new (t || SearchList)(i0.ɵɵdirectiveInject(i1.Logger)); };
SearchList.ɵcmp = i0.ɵɵdefineComponent({ type: SearchList, selectors: [["search-list"]], inputs: { items: "items", searchText: "searchText", showIndex: "showIndex", searchKeys: "searchKeys", trackByFn: "trackByFn", searchInputVisible: "searchInputVisible", focusInput: "focusInput" }, outputs: { searchTextChange: "searchTextChange", selectedItem: "selectedItem" }, decls: 3, vars: 7, consts: [[3, "text", "focus", "style", "textChange", 4, "ngIf"], [3, "items", "showIndex", "trackByFn", "selectedItem"], [3, "text", "focus", "textChange"]], template: function SearchList_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵelementStart(0, "box");
        i0.ɵɵtemplate(1, SearchList_tui_input_1_Template, 1, 5, "tui-input", 0);
        i0.ɵɵelementStart(2, "list", 1);
        i0.ɵɵlistener("selectedItem", function SearchList_Template_list_selectedItem_2_listener($event) { return ctx.selectedItem.next($event); });
        i0.ɵɵelementEnd();
        i0.ɵɵelementEnd();
    } if (rf & 2) {
        i0.ɵɵstyleMap(i0.ɵɵpureFunction0(6, _c1));
        i0.ɵɵadvance(1);
        i0.ɵɵproperty("ngIf", ctx.searchInputVisible);
        i0.ɵɵadvance(1);
        i0.ɵɵproperty("items", ctx.matchingItems.$)("showIndex", ctx.showIndex)("trackByFn", ctx.trackByFn);
    } }, directives: [i2.Box, i3.StyleDirective, i4.NgIf, i5.List, i6.TuiInput, i7.FocusDirective], encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(SearchList, [{
        type: core_1.Component,
        args: [{
                selector: 'search-list',
                template: `
    <box [style]="{ flexDirection: 'column' }">
      <tui-input
        *ngIf="searchInputVisible"
        [text]="searchText"
        [focus]="focusInput"
        (textChange)="searchTextChange.next($event)"
        [style]="{ backgroundColor: 'gray', color: 'white' }"></tui-input>
      <list
        [items]="matchingItems.$"
        (selectedItem)="selectedItem.next($event)"
        [showIndex]="showIndex"
        [trackByFn]="trackByFn"></list>
    </box>
  `,
            }]
    }], function () { return [{ type: i1.Logger }]; }, { items: [{
            type: core_1.Input
        }], searchText: [{
            type: core_1.Input
        }], showIndex: [{
            type: core_1.Input
        }], searchKeys: [{
            type: core_1.Input
        }], trackByFn: [{
            type: core_1.Input
        }], searchInputVisible: [{
            type: core_1.Input
        }], focusInput: [{
            type: core_1.Input
        }], searchTextChange: [{
            type: core_1.Output
        }], selectedItem: [{
            type: core_1.Output
        }] }); })();
