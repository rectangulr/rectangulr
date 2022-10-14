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
exports.TerminalErrorHandler = void 0;
const core_1 = require("@angular/core");
const i0 = __importStar(require("@angular/core"));
const i1 = __importStar(require("./screen-service"));
const i2 = __importStar(require("./logger"));
class TerminalErrorHandler {
    constructor(screen, logger) {
        this.screen = screen;
        this.logger = logger;
    }
    handleError(error) {
        this.logger.log(error);
        this.screen.screen.releaseScreen();
        globalThis.original_console.log(error);
        process.exit(1);
    }
}
exports.TerminalErrorHandler = TerminalErrorHandler;
TerminalErrorHandler.ɵfac = function TerminalErrorHandler_Factory(t) { return new (t || TerminalErrorHandler)(i0.ɵɵinject(i1.Screen), i0.ɵɵinject(i2.Logger)); };
TerminalErrorHandler.ɵprov = i0.ɵɵdefineInjectable({ token: TerminalErrorHandler, factory: TerminalErrorHandler.ɵfac });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(TerminalErrorHandler, [{
        type: core_1.Injectable
    }], function () { return [{ type: i1.Screen }, { type: i2.Logger }]; }, null); })();
