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
exports.ObjectEditor = exports.KeyValueEditor = void 0;
const core_1 = require("@angular/core");
const forms_1 = require("@angular/forms");
const _ = __importStar(require("lodash"));
const json5 = __importStar(require("json5"));
const rxjs_1 = require("rxjs");
const reactivity_1 = require("../../lib/reactivity");
const utils_1 = require("../../lib/utils");
const styles_1 = require("./styles");
const command_service_1 = require("../../commands/command-service");
const i0 = __importStar(require("@angular/core"));
const i1 = __importStar(require("../../commands/command-service"));
const i2 = __importStar(require("@angular/forms"));
const i3 = __importStar(require("../1-basics/box"));
const i4 = __importStar(require("../1-basics/style"));
const i5 = __importStar(require("../1-basics/classes"));
const i6 = __importStar(require("../1-basics/input"));
const i7 = __importStar(require("../../angular-terminal/logger"));
const i8 = __importStar(require("./list/list"));
const _c0 = function () { return { flexDirection: "row" }; };
const _c1 = function (a0) { return { width: a0 }; };
const _c2 = function (a0) { return [a0]; };
class KeyValueEditor {
    constructor(commandService, formGroup) {
        this.commandService = commandService;
        this.formGroup = formGroup;
        this.keyWidth = 8;
        this.blackOnWhite = styles_1.blackOnWhite;
    }
    ngOnDestroy() {
        this.commandService.unfocus();
    }
}
exports.KeyValueEditor = KeyValueEditor;
KeyValueEditor.ɵfac = function KeyValueEditor_Factory(t) { return new (t || KeyValueEditor)(i0.ɵɵdirectiveInject(i1.CommandService), i0.ɵɵdirectiveInject(i2.FormGroup)); };
KeyValueEditor.ɵcmp = i0.ɵɵdefineComponent({ type: KeyValueEditor, selectors: [["keyvalue-editor"]], inputs: { keyValue: ["object", "keyValue"], keyWidth: "keyWidth" }, features: [i0.ɵɵProvidersFeature([command_service_1.CommandService])], decls: 5, vars: 14, consts: [[3, "formGroup"], [3, "classes"], [3, "formControlName", "text"], ["input", ""]], template: function KeyValueEditor_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵelementStart(0, "box", 0);
        i0.ɵɵelementStart(1, "box", 1);
        i0.ɵɵtext(2);
        i0.ɵɵelementEnd();
        i0.ɵɵelement(3, "tui-input", 2, 3);
        i0.ɵɵelementEnd();
    } if (rf & 2) {
        i0.ɵɵstyleMap(i0.ɵɵpureFunction0(9, _c0));
        i0.ɵɵproperty("formGroup", ctx.formGroup);
        i0.ɵɵadvance(1);
        i0.ɵɵstyleMap(i0.ɵɵpureFunction1(10, _c1, ctx.keyWidth + 1));
        i0.ɵɵproperty("classes", i0.ɵɵpureFunction1(12, _c2, ctx.blackOnWhite));
        i0.ɵɵadvance(1);
        i0.ɵɵtextInterpolate(ctx.keyValue.key);
        i0.ɵɵadvance(1);
        i0.ɵɵproperty("formControlName", ctx.keyValue.key)("text", ctx.keyValue.value);
    } }, directives: [i3.Box, i2.NgControlStatusGroup, i2.FormGroupDirective, i4.StyleDirective, i5.NativeClassesDirective, i6.TuiInput, i2.NgControlStatus, i2.FormControlName], encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(KeyValueEditor, [{
        type: core_1.Component,
        args: [{
                selector: 'keyvalue-editor',
                template: `
    <box [formGroup]="formGroup" [style]="{ flexDirection: 'row' }">
      <box [style]="{ width: keyWidth + 1 }" [classes]="[blackOnWhite]">{{ keyValue.key }}</box>
      <tui-input [formControlName]="keyValue.key" #input [text]="keyValue.value"></tui-input>
    </box>
  `,
                providers: [command_service_1.CommandService],
            }]
    }], function () { return [{ type: i1.CommandService }, { type: i2.FormGroup }]; }, { keyValue: [{
            type: core_1.Input,
            args: ['object']
        }], keyWidth: [{
            type: core_1.Input
        }] }); })();
class ObjectEditor {
    constructor(logger, fb, commandService) {
        this.logger = logger;
        this.fb = fb;
        this.commandService = commandService;
        this.onSubmit = new rxjs_1.Subject();
        this.longestKey = 0;
        this.keybinds = [
            {
                keys: 'enter',
                func: () => {
                    const value = mapBackToOriginalTypes({
                        formObject: this.form.value,
                        originalObject: this._object.value,
                    });
                    this.onSubmit.next(value);
                },
            },
        ];
        this.blackOnWhite = styles_1.blackOnWhite;
        this.KeyValueEditor = KeyValueEditor;
        this.destroy$ = new rxjs_1.Subject();
        this._object = new reactivity_1.State(null, this.destroy$);
        this._object.$.subscribe(object => {
            if (!object) {
                object = {};
            }
            const simpleObject = simplifyObject(object);
            this.keyValues = Object.entries(simpleObject).map(([key, value]) => ({
                key: key,
                value: value,
            }));
            this.longestKey = utils_1.longest(this.keyValues);
            this.form = this.fb.group(simpleObject);
        });
        command_service_1.registerCommands(this, this.keybinds);
    }
    set object(object) {
        this._object.subscribeSource(object);
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
exports.ObjectEditor = ObjectEditor;
ObjectEditor.ɵfac = function ObjectEditor_Factory(t) { return new (t || ObjectEditor)(i0.ɵɵdirectiveInject(i7.Logger), i0.ɵɵdirectiveInject(i2.FormBuilder), i0.ɵɵdirectiveInject(i1.CommandService)); };
ObjectEditor.ɵcmp = i0.ɵɵdefineComponent({ type: ObjectEditor, selectors: [["object-editor"]], inputs: { object: "object" }, outputs: { onSubmit: "onSubmit" }, features: [i0.ɵɵProvidersFeature([
            {
                provide: forms_1.FormGroup,
                useFactory: (objectEditor) => objectEditor.form,
                deps: [ObjectEditor],
            },
        ])], decls: 1, vars: 2, consts: [[3, "items", "displayComponent"]], template: function ObjectEditor_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵelement(0, "list", 0);
    } if (rf & 2) {
        i0.ɵɵproperty("items", ctx.keyValues)("displayComponent", ctx.KeyValueEditor);
    } }, directives: [i8.List], encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ObjectEditor, [{
        type: core_1.Component,
        args: [{
                selector: 'object-editor',
                template: ` <list [items]="keyValues" [displayComponent]="KeyValueEditor"></list> `,
                providers: [
                    {
                        provide: forms_1.FormGroup,
                        useFactory: (objectEditor) => objectEditor.form,
                        deps: [ObjectEditor],
                    },
                ],
            }]
    }], function () { return [{ type: i7.Logger }, { type: i2.FormBuilder }, { type: i1.CommandService }]; }, { object: [{
            type: core_1.Input
        }], onSubmit: [{
            type: core_1.Output
        }] }); })();
// Removes arrays. Transforms values into strings.
function simplifyObject(object) {
    return utils_1.mapKeyValue(object, (key, value) => {
        if (Array.isArray(value)) {
            return undefined;
        }
        else if (value === null) {
            return [key, ''];
        }
        else {
            return [key, String(value)];
        }
    });
}
function mapBackToOriginalTypes(args) {
    const { formObject, originalObject } = args;
    return _.mapValues(formObject, (value, key) => {
        if (_.has(originalObject, key)) {
            const originalValue = originalObject[key];
            const originalType = typeof originalValue;
            if (originalValue === null && ['', 'null'].includes(value)) {
                return null;
            }
            else if (originalType === 'boolean') {
                return !['null', 'no', 'false', '0'].includes(value);
            }
            else if (originalType === 'string') {
                return value;
            }
            else if (originalType === 'number') {
                return Number(value);
            }
            else if (originalType === 'bigint') {
                return BigInt(value);
            }
            else if (originalType === 'object') {
                return json5.parse(value);
            }
        }
        else {
            return value;
        }
    });
}
