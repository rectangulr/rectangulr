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
exports.OnEnterDirective = void 0;
const core_1 = require("@angular/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const command_service_1 = require("../../../commands/command-service");
const i0 = __importStar(require("@angular/core"));
const i1 = __importStar(require("./list"));
class OnEnterDirective {
    constructor(list) {
        this.list = list;
        this.onEnter = new core_1.EventEmitter();
        this.selectedItem = null;
        this.commands = [
            {
                keys: 'enter',
                func: () => {
                    this.onEnter.emit(this.selectedItem);
                },
            },
        ];
        this.destroy$ = new rxjs_1.Subject();
        command_service_1.registerCommands(list, this.commands);
        this.list.selectedItem.pipe(operators_1.takeUntil(this.destroy$)).subscribe(selectedItem => {
            this.selectedItem = selectedItem.value;
        });
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
exports.OnEnterDirective = OnEnterDirective;
OnEnterDirective.ɵfac = function OnEnterDirective_Factory(t) { return new (t || OnEnterDirective)(i0.ɵɵdirectiveInject(i1.List)); };
OnEnterDirective.ɵdir = i0.ɵɵdefineDirective({ type: OnEnterDirective, selectors: [["", "onEnter", ""]], outputs: { onEnter: "onEnter" } });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(OnEnterDirective, [{
        type: core_1.Directive,
        args: [{
                selector: '[onEnter]',
            }]
    }], function () { return [{ type: i1.List }]; }, { onEnter: [{
            type: core_1.Output
        }] }); })();
