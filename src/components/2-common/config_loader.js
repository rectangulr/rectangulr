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
exports.ConfigLoader = void 0;
const core_1 = require("@angular/core");
const fs = __importStar(require("fs"));
const json5 = __importStar(require("json5"));
const i0 = __importStar(require("@angular/core"));
class ConfigLoader {
    constructor() {
        this.fileName = 'config.json';
        const jsonData = fs.readFileSync(this.fileName, { encoding: 'utf-8' });
        this.config = json5.parse(jsonData);
    }
}
exports.ConfigLoader = ConfigLoader;
ConfigLoader.ɵfac = function ConfigLoader_Factory(t) { return new (t || ConfigLoader)(); };
ConfigLoader.ɵprov = i0.ɵɵdefineInjectable({ token: ConfigLoader, factory: ConfigLoader.ɵfac, providedIn: 'root' });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ConfigLoader, [{
        type: core_1.Injectable,
        args: [{
                providedIn: 'root',
            }]
    }], function () { return []; }, null); })();
