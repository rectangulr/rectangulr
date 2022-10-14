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
exports.StyleFlexAlignment = void 0;
const Yoga = __importStar(require("yoga-layout"));
class StyleFlexAlignment {
    serialize() {
        return null;
    }
    inspect() {
        return this.serialize();
    }
}
exports.StyleFlexAlignment = StyleFlexAlignment;
StyleFlexAlignment.auto = null;
StyleFlexAlignment.flexStart = null;
StyleFlexAlignment.flexEnd = null;
StyleFlexAlignment.center = null;
StyleFlexAlignment.spaceBetween = null;
StyleFlexAlignment.spaceAround = null;
StyleFlexAlignment.stretch = null;
StyleFlexAlignment.auto = new StyleFlexAlignment();
StyleFlexAlignment.auto.serialize = () => `auto`;
StyleFlexAlignment.auto.toYoga = () => Yoga.ALIGN_AUTO;
StyleFlexAlignment.flexStart = new StyleFlexAlignment();
StyleFlexAlignment.flexStart.serialize = () => `flexStart`;
StyleFlexAlignment.flexStart.toYoga = () => Yoga.ALIGN_FLEX_START;
StyleFlexAlignment.flexEnd = new StyleFlexAlignment();
StyleFlexAlignment.flexEnd.serialize = () => `flexEnd`;
StyleFlexAlignment.flexEnd.toYoga = () => Yoga.ALIGN_FLEX_END;
StyleFlexAlignment.center = new StyleFlexAlignment();
StyleFlexAlignment.center.serialize = () => `center`;
StyleFlexAlignment.center.toYoga = () => Yoga.ALIGN_CENTER;
StyleFlexAlignment.spaceBetween = new StyleFlexAlignment();
StyleFlexAlignment.spaceBetween.serialize = () => `spaceBetween`;
StyleFlexAlignment.spaceBetween.toYoga = () => Yoga.ALIGN_SPACE_BETWEEN;
StyleFlexAlignment.spaceAround = new StyleFlexAlignment();
StyleFlexAlignment.spaceAround.serialize = () => `spaceAround`;
StyleFlexAlignment.spaceAround.toYoga = () => Yoga.ALIGN_SPACE_AROUND;
StyleFlexAlignment.stretch = new StyleFlexAlignment();
StyleFlexAlignment.stretch.serialize = () => `stretch`;
StyleFlexAlignment.stretch.toYoga = () => Yoga.ALIGN_STRETCH;
