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
exports.forwardToTextLayout = exports.forwardToYoga = exports.onNullSwitch = exports.dirtyRenderList = exports.dirtyFocusList = exports.dirtyRendering = exports.dirtyClipping = exports.dirtyLayout = void 0;
const lodash_1 = require("lodash");
const Yoga = __importStar(require("yoga-layout"));
function dirtyLayout(node) {
    node.setDirtyLayoutFlag();
}
exports.dirtyLayout = dirtyLayout;
function dirtyClipping(node) {
    node.setDirtyClippingFlag();
}
exports.dirtyClipping = dirtyClipping;
function dirtyRendering(node) {
    node.queueDirtyRect();
}
exports.dirtyRendering = dirtyRendering;
function dirtyFocusList(node) {
    node.rootNode.setDirtyFocusListFlag();
}
exports.dirtyFocusList = dirtyFocusList;
function dirtyRenderList(node) {
    node.rootNode.setDirtyRenderListFlag();
}
exports.dirtyRenderList = dirtyRenderList;
function onNullSwitch(trigger) {
    return function (node, newValue, oldValue) {
        if (lodash_1.isNull(newValue) === lodash_1.isNull(oldValue))
            return;
        trigger(node, newValue, oldValue);
    };
}
exports.onNullSwitch = onNullSwitch;
function forwardToYoga(fnName, ...args) {
    // @ts-ignore
    if (!Yoga.Node.prototype[fnName])
        throw new Error(`Invalid Yoga method "${fnName}"`);
    return function (node, newValue) {
        node.yogaNode[fnName](...args.map(arg => {
            if (typeof arg === `function`) {
                return arg(newValue);
            }
            else {
                return arg;
            }
        }));
    };
}
exports.forwardToYoga = forwardToYoga;
forwardToYoga.value = function (value) {
    if (value != null) {
        return value.toYoga();
    }
    else {
        return value;
    }
};
function forwardToTextLayout(optName, cb) {
    return function (node, newValue) {
        if (!node.textLayout)
            return;
        node.textLayout.setConfiguration({ [optName]: cb(newValue) });
    };
}
exports.forwardToTextLayout = forwardToTextLayout;
