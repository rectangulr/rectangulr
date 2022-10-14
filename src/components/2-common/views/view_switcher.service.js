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
exports.ViewSwitcherService = exports.View = void 0;
const core_1 = require("@angular/core");
const rxjs_1 = require("rxjs");
const command_service_1 = require("../../../commands/command-service");
const reactivity_1 = require("../../../lib/reactivity");
const i0 = __importStar(require("@angular/core"));
const i1 = __importStar(require("../../../commands/command-service"));
class View {
}
exports.View = View;
class ViewSwitcherService {
    constructor(commandService, views) {
        this.commandService = commandService;
        this.views = views;
        this.currentView = this.views.find(v => v);
        this.$currentView = new rxjs_1.BehaviorSubject(null);
        this.commands = [
            {
                keys: 'alt+o',
                id: 'cycleView',
                func: () => {
                    this.cycleView();
                },
            },
        ];
        this.destroy$ = new rxjs_1.Subject();
        command_service_1.registerCommands(this, this.commands);
        reactivity_1.onChangeEmit(this, 'currentView', '$currentView');
    }
    switchTo(viewName) {
        const view = this.views.find(v => v.name == viewName);
        if (!view)
            throw new Error(`couldnt find view: ${viewName}`);
        this.currentView = view;
    }
    cycleView() {
        const currentIndex = this.views.indexOf(this.currentView);
        let newIndex = currentIndex + 1;
        if (newIndex > this.views.length - 1) {
            newIndex = 0;
        }
        this.currentView = this.views[newIndex];
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
exports.ViewSwitcherService = ViewSwitcherService;
ViewSwitcherService.ɵfac = function ViewSwitcherService_Factory(t) { return new (t || ViewSwitcherService)(i0.ɵɵinject(i1.CommandService), i0.ɵɵinject(View)); };
ViewSwitcherService.ɵprov = i0.ɵɵdefineInjectable({ token: ViewSwitcherService, factory: ViewSwitcherService.ɵfac, providedIn: 'root' });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ViewSwitcherService, [{
        type: core_1.Injectable,
        args: [{
                providedIn: 'root',
            }]
    }], function () { return [{ type: i1.CommandService }, { type: undefined, decorators: [{
                type: core_1.Inject,
                args: [View]
            }] }]; }, null); })();
