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
exports.StyleFlexDirection = void 0;
const Yoga = __importStar(require("yoga-layout"));
class StyleFlexDirection {
    serialize() {
        return null;
    }
    inspect() {
        return this.serialize();
    }
}
exports.StyleFlexDirection = StyleFlexDirection;
StyleFlexDirection.row = null;
StyleFlexDirection.rowReverse = null;
StyleFlexDirection.column = null;
StyleFlexDirection.columnReverse = null;
StyleFlexDirection.row = new StyleFlexDirection();
StyleFlexDirection.row.serialize = () => `row`;
StyleFlexDirection.row.toYoga = () => Yoga.FLEX_DIRECTION_ROW;
StyleFlexDirection.rowReverse = new StyleFlexDirection();
StyleFlexDirection.rowReverse.serialize = () => `rowReverse`;
StyleFlexDirection.rowReverse.toYoga = () => Yoga.FLEX_DIRECTION_ROW_REVERSE;
StyleFlexDirection.column = new StyleFlexDirection();
StyleFlexDirection.column.serialize = () => `column`;
StyleFlexDirection.column.toYoga = () => Yoga.FLEX_DIRECTION_COLUMN;
StyleFlexDirection.columnReverse = new StyleFlexDirection();
StyleFlexDirection.columnReverse.serialize = () => `columnReverse`;
StyleFlexDirection.columnReverse.toYoga = () => Yoga.FLEX_DIRECTION_COLUMN_REVERSE;
