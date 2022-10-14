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
exports.TerminalModule = void 0;
const core_1 = require("@angular/core");
const forms_1 = require("@angular/forms");
const platform_browser_1 = require("@angular/platform-browser");
const ng_dynamic_component_1 = require("ng-dynamic-component");
const object_display_1 = require("../components/2-common/object_display");
const object_editor_1 = require("../components/2-common/object_editor");
const search_list_1 = require("../components/2-common/search_list");
const view_switcher_component_1 = require("../components/2-common/views/view_switcher.component");
const commands_1 = require("../commands/commands");
const focus_1 = require("../commands/focus");
const classes_1 = require("../components/1-basics/classes");
const style_1 = require("../components/1-basics/style");
const input_1 = require("../components/1-basics/input");
const list_1 = require("../components/2-common/list/list");
const list_on_enter_1 = require("../components/2-common/list/list_on_enter");
const error_handler_1 = require("./error-handler");
const angular_dom_1 = require("./angular-dom");
const screen_service_1 = require("./screen-service");
const box_1 = require("../components/1-basics/box");
const i0 = __importStar(require("@angular/core"));
const declarations = [
    box_1.Box,
    list_1.List,
    list_1.ListItem,
    search_list_1.SearchList,
    list_on_enter_1.OnEnterDirective,
    input_1.TuiInput,
    object_display_1.ObjectDisplay,
    object_editor_1.ObjectEditor,
    list_1.BasicObjectDisplay,
    list_1.TableObjectDisplay,
    style_1.StyleDirective,
    style_1.StylesDirective,
    classes_1.ClassesDirective,
    classes_1.NativeClassesDirective,
    focus_1.FocusDirective,
    focus_1.FocusSeparateDirective,
    object_editor_1.KeyValueEditor,
    search_list_1.SearchList,
    commands_1.CommandsDisplay,
    view_switcher_component_1.ViewSwitcher,
];
class TerminalModule {
}
exports.TerminalModule = TerminalModule;
TerminalModule.ɵfac = function TerminalModule_Factory(t) { return new (t || TerminalModule)(); };
TerminalModule.ɵmod = i0.ɵɵdefineNgModule({ type: TerminalModule });
TerminalModule.ɵinj = i0.ɵɵdefineInjector({ providers: [
        screen_service_1.Screen,
        { provide: core_1.RendererFactory2, useClass: angular_dom_1.TerminalRendererFactory },
        { provide: core_1.ErrorHandler, useClass: error_handler_1.TerminalErrorHandler },
        {
            // used by ./lib/reactivity.ts -> forceRefresh()
            provide: core_1.APP_INITIALIZER,
            useValue: () => {
                // @ts-ignore
                globalThis['angularZone'] = Zone.current;
                // @ts-ignore
                globalThis['rootZone'] = Zone.current.parent;
            },
            multi: true,
        },
    ], imports: [[platform_browser_1.BrowserModule, ng_dynamic_component_1.DynamicModule, forms_1.ReactiveFormsModule], platform_browser_1.BrowserModule, ng_dynamic_component_1.DynamicModule, forms_1.ReactiveFormsModule] });
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && i0.ɵɵsetNgModuleScope(TerminalModule, { declarations: [box_1.Box,
        list_1.List,
        list_1.ListItem,
        search_list_1.SearchList,
        list_on_enter_1.OnEnterDirective,
        input_1.TuiInput,
        object_display_1.ObjectDisplay,
        object_editor_1.ObjectEditor,
        list_1.BasicObjectDisplay,
        list_1.TableObjectDisplay,
        style_1.StyleDirective,
        style_1.StylesDirective,
        classes_1.ClassesDirective,
        classes_1.NativeClassesDirective,
        focus_1.FocusDirective,
        focus_1.FocusSeparateDirective,
        object_editor_1.KeyValueEditor,
        search_list_1.SearchList,
        commands_1.CommandsDisplay,
        view_switcher_component_1.ViewSwitcher], imports: [platform_browser_1.BrowserModule, ng_dynamic_component_1.DynamicModule, forms_1.ReactiveFormsModule], exports: [box_1.Box,
        list_1.List,
        list_1.ListItem,
        search_list_1.SearchList,
        list_on_enter_1.OnEnterDirective,
        input_1.TuiInput,
        object_display_1.ObjectDisplay,
        object_editor_1.ObjectEditor,
        list_1.BasicObjectDisplay,
        list_1.TableObjectDisplay,
        style_1.StyleDirective,
        style_1.StylesDirective,
        classes_1.ClassesDirective,
        classes_1.NativeClassesDirective,
        focus_1.FocusDirective,
        focus_1.FocusSeparateDirective,
        object_editor_1.KeyValueEditor,
        search_list_1.SearchList,
        commands_1.CommandsDisplay,
        view_switcher_component_1.ViewSwitcher, platform_browser_1.BrowserModule, ng_dynamic_component_1.DynamicModule, forms_1.ReactiveFormsModule] }); })();
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(TerminalModule, [{
        type: core_1.NgModule,
        args: [{
                imports: [platform_browser_1.BrowserModule, ng_dynamic_component_1.DynamicModule, forms_1.ReactiveFormsModule],
                declarations: declarations,
                exports: [...declarations, platform_browser_1.BrowserModule, ng_dynamic_component_1.DynamicModule, forms_1.ReactiveFormsModule],
                providers: [
                    screen_service_1.Screen,
                    { provide: core_1.RendererFactory2, useClass: angular_dom_1.TerminalRendererFactory },
                    { provide: core_1.ErrorHandler, useClass: error_handler_1.TerminalErrorHandler },
                    {
                        // used by ./lib/reactivity.ts -> forceRefresh()
                        provide: core_1.APP_INITIALIZER,
                        useValue: () => {
                            // @ts-ignore
                            globalThis['angularZone'] = Zone.current;
                            // @ts-ignore
                            globalThis['rootZone'] = Zone.current.parent;
                        },
                        multi: true,
                    },
                ],
            }]
    }], null, null); })();
