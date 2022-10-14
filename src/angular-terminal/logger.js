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
exports.patchGlobalConsole = exports.Logger = exports.clearLogFile = exports.logFunction = void 0;
const core_1 = require("@angular/core");
const fs = __importStar(require("fs"));
const utils_1 = require("../lib/utils");
const i0 = __importStar(require("@angular/core"));
const logFile = './log.json';
let logs = [];
utils_1.addToGlobal({
    debug: {
        logs: () => logs.slice(-100),
    },
});
function logFunction(thing) {
    let logObject = null;
    if (typeof thing == 'string') {
        logObject = { message: thing };
    }
    else {
        logObject = thing;
    }
    logs.push(logObject);
    if (logs.length > 200) {
        logs = logs.slice(-100);
    }
    fs.writeFileSync(logFile, stringify(logObject) + '\n', { flag: 'a+' });
}
exports.logFunction = logFunction;
function clearLogFile() {
    fs.writeFileSync(logFile, '', { flag: 'w' });
}
exports.clearLogFile = clearLogFile;
// As a service
class Logger {
    constructor() {
        this.log = logFunction;
    }
}
exports.Logger = Logger;
Logger.ɵfac = function Logger_Factory(t) { return new (t || Logger)(); };
Logger.ɵprov = i0.ɵɵdefineInjectable({ token: Logger, factory: Logger.ɵfac, providedIn: 'root' });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(Logger, [{
        type: core_1.Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
function stringify(thing) {
    var cache = [];
    if (thing instanceof Error) {
        const property = Object.getOwnPropertyDescriptor(thing, 'message');
        Object.defineProperty(thing, 'message', { ...property, enumerable: true });
    }
    return JSON.stringify(thing, function (key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                return;
            }
            cache.push(value);
        }
        return value;
    }, 2);
}
/**
 * Using console.log messes up the display in the terminal.
 * This patches the console.* functions to write to a file instead.
 * */
function patchGlobalConsole() {
    // Save original
    globalThis['original_console'] = {
        error: console.error,
        log: console.log,
        info: console.info,
        debug: console.debug,
        warn: console.warn,
    };
    // Replace
    console.error = logFunction;
    console.log = logFunction;
    console.info = logFunction;
    console.debug = logFunction;
    console.warn = logFunction;
    clearLogFile();
}
exports.patchGlobalConsole = patchGlobalConsole;
