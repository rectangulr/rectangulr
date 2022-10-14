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
exports.TuiInput = void 0;
const core_1 = require("@angular/core");
const forms_1 = require("@angular/forms");
const _ = __importStar(require("lodash"));
const rxjs_1 = require("rxjs");
const command_service_1 = require("../../commands/command-service");
const dom_terminal_1 = require("../../angular-terminal/dom-terminal");
const reactivity_1 = require("../../lib/reactivity");
const i0 = __importStar(require("@angular/core"));
const i1 = __importStar(require("../../commands/command-service"));
const i2 = __importStar(require("./box"));
const _c0 = ["box"];
let globalId = 0;
class TuiInput {
    constructor(commandService) {
        this.commandService = commandService;
        this._id = ++globalId;
        this.text = '';
        this.textChange = new rxjs_1.BehaviorSubject(this.text);
        this.caretIndex = 0;
        this.destroy$ = new rxjs_1.Subject();
        this.ControlValueAccessorData = {
            disabled: false,
            onChange: (value) => { },
            onTouched: () => { },
        };
        reactivity_1.onChange(this, 'text', value => {
            this.textChange.next(value);
            this.ControlValueAccessorData.onChange(value);
        });
        reactivity_1.onChange(this, 'caretIndex', value => this.updateNativeCaret(), value => _.clamp(value, 0, this.text.length));
    }
    ngOnInit() {
        this.caretIndex = this.text.length;
        const keybinds = [
            {
                keys: 'left',
                func: () => {
                    this.caretIndex--;
                },
            },
            {
                keys: 'right',
                func: () => {
                    this.caretIndex++;
                },
            },
            {
                keys: 'home',
                func: () => {
                    this.caretIndex = 0;
                },
            },
            {
                keys: 'end',
                func: () => {
                    this.caretIndex = this.text.length;
                },
            },
            {
                keys: 'backspace',
                func: () => {
                    this.text =
                        this.text.substring(0, this.caretIndex - 1) + this.text.substring(this.caretIndex);
                    this.caretIndex--;
                },
            },
            {
                keys: 'ctrl+left',
                func: () => {
                    this.caretIndex = searchFromIndex(this.text, this.caretIndex, -1);
                },
            },
            {
                keys: 'ctrl+u',
                func: () => {
                    this.text = '';
                    this.caretIndex = 0;
                },
            },
            {
                keys: 'ctrl+right',
                func: () => {
                    this.caretIndex = searchFromIndex(this.text, this.caretIndex, +1);
                },
            },
            {
                /* ctrl+backspace */ keys: ['ctrl+h', 'ctrl+w'],
                func: () => {
                    const index = searchFromIndex(this.text, this.caretIndex, -1);
                    this.text =
                        this.text.substring(0, index) + this.text.substring(this.caretIndex, this.text.length);
                    this.caretIndex = index;
                },
            },
            {
                keys: 'delete',
                func: () => {
                    this.text =
                        this.text.substring(0, this.caretIndex) + this.text.substring(this.caretIndex + 1);
                },
            },
            {
                keys: 'else',
                func: key => {
                    if (!key.shift && !key.ctrl && !key.alt && !key.meta && key.name.length == 1) {
                        this.text =
                            this.text.substring(0, this.caretIndex) +
                                key.name +
                                this.text.substring(this.caretIndex);
                        this.caretIndex++;
                    }
                    else {
                        return key;
                    }
                },
            },
        ];
        command_service_1.registerCommands(this, keybinds);
        this.commandService.requestFocus();
    }
    ngAfterViewInit() {
        this.termTextRef = this.boxRef.nativeElement.childNodes[0];
        this.updateNativeCaret();
        this.commandService.requestCaret(this.termTextRef);
    }
    updateNativeCaret() {
        if (this.termTextRef) {
            this.termTextRef.caret = new dom_terminal_1.Point({ x: this.caretIndex, y: 0 });
            this.termTextRef.scrollCellIntoView(this.termTextRef.caret);
        }
    }
    ngOnDestroy() {
        this.commandService.unfocus();
        this.destroy$.next();
        this.destroy$.complete();
    }
    // implements ControlValueAccessor, so a form can read/write the value of this input
    writeValue(value) {
        this.text = value;
        this.caretIndex = _.clamp(this.caretIndex, 0, this.text.length);
        this.ControlValueAccessorData.onChange(value);
    }
    registerOnChange(fn) {
        this.ControlValueAccessorData.onChange = fn;
    }
    registerOnTouched(fn) {
        this.ControlValueAccessorData.onTouched = fn;
    }
    setDisabledState(disabled) {
        this.ControlValueAccessorData.disabled = disabled;
    }
}
exports.TuiInput = TuiInput;
TuiInput.ɵfac = function TuiInput_Factory(t) { return new (t || TuiInput)(i0.ɵɵdirectiveInject(i1.CommandService)); };
TuiInput.ɵcmp = i0.ɵɵdefineComponent({ type: TuiInput, selectors: [["tui-input"]], viewQuery: function TuiInput_Query(rf, ctx) { if (rf & 1) {
        i0.ɵɵviewQuery(_c0, 1);
    } if (rf & 2) {
        let _t;
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.boxRef = _t.first);
    } }, inputs: { text: "text" }, outputs: { textChange: "textChange" }, features: [i0.ɵɵProvidersFeature([
            {
                provide: forms_1.NG_VALUE_ACCESSOR,
                useExisting: core_1.forwardRef(() => TuiInput),
                multi: true,
            },
            { provide: command_service_1.CommandService },
        ])], decls: 3, vars: 1, consts: [["box", ""]], template: function TuiInput_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵelementStart(0, "box", null, 0);
        i0.ɵɵtext(2);
        i0.ɵɵelementEnd();
    } if (rf & 2) {
        i0.ɵɵadvance(2);
        i0.ɵɵtextInterpolate(ctx.text);
    } }, directives: [i2.Box], encapsulation: 2 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(TuiInput, [{
        type: core_1.Component,
        args: [{
                selector: 'tui-input',
                template: `<box #box>{{ text }}</box>`,
                providers: [
                    {
                        provide: forms_1.NG_VALUE_ACCESSOR,
                        useExisting: core_1.forwardRef(() => TuiInput),
                        multi: true,
                    },
                    { provide: command_service_1.CommandService },
                ],
            }]
    }], function () { return [{ type: i1.CommandService }]; }, { text: [{
            type: core_1.Input
        }], textChange: [{
            type: core_1.Output
        }], boxRef: [{
            type: core_1.ViewChild,
            args: ['box']
        }] }); })();
function searchFromIndex(text, startIndex, incrementBy = 1, characters = ` \t\`~!@#$%^&*()-=+[{]}\|;:'",.<>/?`) {
    let index = startIndex + incrementBy;
    if (characters.includes(text[index])) {
        index += incrementBy;
    }
    while (true) {
        if (index <= 0 || index >= text.length) {
            return index;
        }
        else if (characters.includes(text[index])) {
            if (incrementBy == 1) {
                return index;
            }
            else {
                index -= incrementBy;
                return index;
            }
        }
        else {
            index += incrementBy;
        }
    }
}
