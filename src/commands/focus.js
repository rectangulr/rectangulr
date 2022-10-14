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
exports.FocusSeparateDirective = exports.FocusDirective = void 0;
const core_1 = require("@angular/core");
const console_1 = require("console");
const command_service_1 = require("./command-service");
const i0 = __importStar(require("@angular/core"));
const i1 = __importStar(require("./command-service"));
class FocusDirective {
    constructor(commandService) {
        this.commandService = commandService;
        this.subscription = null;
    }
    ngOnInit() {
        console_1.assert(this.focus);
        this.subscription = this.focus.subscribe(() => {
            this.commandService.focus();
        });
    }
    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
exports.FocusDirective = FocusDirective;
FocusDirective.ɵfac = function FocusDirective_Factory(t) { return new (t || FocusDirective)(i0.ɵɵdirectiveInject(i1.CommandService)); };
FocusDirective.ɵdir = i0.ɵɵdefineDirective({ type: FocusDirective, selectors: [["", "focus", ""]], inputs: { focus: "focus" } });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(FocusDirective, [{
        type: core_1.Directive,
        args: [{
                selector: '[focus]',
            }]
    }], function () { return [{ type: i1.CommandService }]; }, { focus: [{
            type: core_1.Input
        }] }); })();
class FocusSeparateDirective {
    constructor(commandService) {
        this.commandService = commandService;
        this.subscription = null;
    }
    ngOnInit() {
        this.subscription = this.focusSeparate.subscribe(() => {
            this.commandService.focus();
        });
    }
    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
exports.FocusSeparateDirective = FocusSeparateDirective;
FocusSeparateDirective.ɵfac = function FocusSeparateDirective_Factory(t) { return new (t || FocusSeparateDirective)(i0.ɵɵdirectiveInject(i1.CommandService)); };
FocusSeparateDirective.ɵdir = i0.ɵɵdefineDirective({ type: FocusSeparateDirective, selectors: [["", "focusSeparate", ""]], inputs: { focusSeparate: "focusSeparate" }, features: [i0.ɵɵProvidersFeature([command_service_1.CommandService])] });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(FocusSeparateDirective, [{
        type: core_1.Directive,
        args: [{
                selector: '[focusSeparate]',
                providers: [command_service_1.CommandService],
            }]
    }], function () { return [{ type: i1.CommandService }]; }, { focusSeparate: [{
            type: core_1.Input
        }] }); })();
