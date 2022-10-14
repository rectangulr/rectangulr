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
exports.StylePosition = void 0;
const Yoga = __importStar(require("yoga-layout"));
class StylePosition {
    constructor({ isPositioned = false, isAbsolutelyPositioned = false, isScrollAware = false, } = {}) {
        this.isPositioned = isPositioned;
        this.isAbsolutelyPositioned = isAbsolutelyPositioned;
        this.isScrollAware = isScrollAware;
    }
    serialize() {
        return null;
    }
    inspect() {
        return this.serialize();
    }
}
exports.StylePosition = StylePosition;
StylePosition.relative = null;
StylePosition.sticky = null;
StylePosition.absolute = null;
StylePosition.fixed = null;
StylePosition.relative = new StylePosition({ isPositioned: true, isScrollAware: true });
StylePosition.relative.serialize = () => `relative`;
StylePosition.relative.toYoga = () => Yoga.POSITION_TYPE_RELATIVE;
StylePosition.sticky = new StylePosition({ isPositioned: true, isScrollAware: true });
StylePosition.sticky.serialize = () => `sticky`;
StylePosition.sticky.toYoga = () => Yoga.POSITION_TYPE_RELATIVE;
StylePosition.absolute = new StylePosition({
    isPositioned: true,
    isAbsolutelyPositioned: true,
    isScrollAware: true,
});
StylePosition.absolute.serialize = () => `absolute`;
StylePosition.absolute.toYoga = () => Yoga.POSITION_TYPE_ABSOLUTE;
StylePosition.fixed = new StylePosition({ isPositioned: true, isAbsolutelyPositioned: true });
StylePosition.fixed.serialize = () => `fixed`;
StylePosition.fixed.toYoga = () => Yoga.POSITION_TYPE_ABSOLUTE;
