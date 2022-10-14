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
exports.addToGlobal = exports.mergeDeep = exports.mapKeyValue = exports.last = exports.remove = exports.removeLastMatch = exports.moveToLast = exports.longest = exports.filterNulls = exports.assert = void 0;
const _ = __importStar(require("lodash"));
const operators_1 = require("rxjs/operators");
/**
 * @example
 * assert(false, "throw this error message")
 * assert(true, "nothing happens")
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'assert failed');
    }
}
exports.assert = assert;
exports.filterNulls = operators_1.filter((i) => i != null);
function longest(array) {
    return array.reduce((previous, current) => {
        return current.key.length > previous ? current.key.length : previous;
    }, 0);
}
exports.longest = longest;
function moveToLast(array, item) {
    _.remove(array, i => i == item);
    array.push(item);
    return array;
}
exports.moveToLast = moveToLast;
function removeLastMatch(array, item) {
    if (array == undefined)
        throw new Error('no array');
    for (let i = array.length - 1; i >= 0; i--) {
        const current = array[i];
        if (current == item) {
            return array.splice(i, 1);
        }
    }
    return array;
}
exports.removeLastMatch = removeLastMatch;
function remove(array, item) {
    _.remove(array, i => i == item);
    return array;
}
exports.remove = remove;
function last(array) {
    if (array.length <= 0) {
        return undefined;
    }
    return array[array.length - 1];
}
exports.last = last;
/**
 * Loop over an object [key,value] and change anything.
 * Creates a new object.
 * If `undefined` is returned, the key is removed from the object.
 */
function mapKeyValue(object, func) {
    let newObject = {};
    for (const [key, value] of Object.entries(object)) {
        const res = func(key, value);
        if (res) {
            const [customName, customValue] = res;
            newObject[customName] = customValue;
        }
    }
    return newObject;
}
exports.mapKeyValue = mapKeyValue;
function mergeDeep(object, other) {
    function customizer(objValue, srcValue) {
        if (_.isArray(objValue)) {
            return objValue.concat(srcValue);
        }
    }
    return _.mergeWith(object, other, customizer);
}
exports.mergeDeep = mergeDeep;
/**
 * Add something to the global variable `rg` from `rectangulr`.
 * @example addToGlobal({
 *  myGlobalFunction: (text)=>{console.log(text)}
 * })
 * rg.myGlobalFunction("print this")
 */
function addToGlobal(obj) {
    globalThis['rg'] || (globalThis['rg'] = {});
    globalThis['rg'] = mergeDeep(globalThis['rg'], obj);
}
exports.addToGlobal = addToGlobal;
