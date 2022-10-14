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
exports.CommandsDisplay = void 0;
const core_1 = require("@angular/core");
const rxjs_1 = require("rxjs");
const map_1 = require("rxjs/internal/operators/map");
const command_service_1 = require("../commands/command-service");
const i0 = __importStar(require("@angular/core"));
const i1 = __importStar(require("../commands/command-service"));
const i2 = __importStar(require("@angular/common"));
const i3 = __importStar(require("../components/2-common/search_list"));
const i4 = __importStar(require("../components/1-basics/style"));
const _c0 = ["searchList"];
const _c1 = function () { return { border: "modern", backgroundColor: "darkgray" }; };
function CommandsDisplay_search_list_0_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelement(0, "search-list", 1, 2);
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵstyleMap(i0.ɵɵpureFunction0(3, _c1));
    i0.ɵɵproperty("items", ctx_r0.commands);
} }
class CommandsDisplay {
    constructor(commandService) {
        this.commandService = commandService;
        this.commands = this.commandService.commandsChange.pipe(map_1.map(commands => Object.keys(commands)));
        this.visible = false;
        this.globalKeybinds = [
            {
                keys: 'alt+p',
                id: 'showCommands',
                func: () => {
                    this.setVisible(true);
                },
            },
        ];
        this.keybinds = [
            {
                keys: 'enter',
                func: () => {
                    let commandId = this.list.selectedItem.value.value;
                    this.commandService.callCommand({ id: commandId });
                    this.setVisible(false);
                },
            },
            {
                keys: 'escape',
                func: () => {
                    this.setVisible(false);
                },
            },
        ];
        this.destroy$ = new rxjs_1.Subject();
    }
    ngOnInit() {
        this.commandService.rootNode.before = this.commandService;
        command_service_1.registerCommands(this, this.globalKeybinds);
    }
    setVisible(visible) {
        this.visible = visible;
        if (visible) {
            this.keybinds.forEach(k => {
                // this.commandService.registerCommand(k)
            });
        }
        else {
            this.keybinds.forEach(k => {
                // this.commandService.removeCommand(k)
            });
            this.commandService.unfocus();
        }
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
exports.CommandsDisplay = CommandsDisplay;
CommandsDisplay.ɵfac = function CommandsDisplay_Factory(t) { return new (t || CommandsDisplay)(i0.ɵɵdirectiveInject(i1.CommandService)); };
CommandsDisplay.ɵcmp = i0.ɵɵdefineComponent({ type: CommandsDisplay, selectors: [["commands"]], viewQuery: function CommandsDisplay_Query(rf, ctx) { if (rf & 1) {
        i0.ɵɵviewQuery(_c0, 1);
    } if (rf & 2) {
        let _t;
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.list = _t.first);
    } }, features: [i0.ɵɵProvidersFeature([command_service_1.CommandService])], decls: 1, vars: 1, consts: [[3, "items", "style", 4, "ngIf"], [3, "items"], ["searchList", ""]], template: function CommandsDisplay_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵtemplate(0, CommandsDisplay_search_list_0_Template, 2, 4, "search-list", 0);
    } if (rf & 2) {
        i0.ɵɵproperty("ngIf", ctx.visible);
    } }, directives: [i2.NgIf, i3.SearchList, i4.StyleDirective], encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(CommandsDisplay, [{
        type: core_1.Component,
        args: [{
                selector: 'commands',
                template: `
    <search-list
      *ngIf="visible"
      #searchList
      [items]="commands"
      [style]="{ border: 'modern', backgroundColor: 'darkgray' }">
    </search-list>
  `,
                providers: [command_service_1.CommandService],
            }]
    }], function () { return [{ type: i1.CommandService }]; }, { list: [{
            type: core_1.ViewChild,
            args: ['searchList']
        }] }); })();
