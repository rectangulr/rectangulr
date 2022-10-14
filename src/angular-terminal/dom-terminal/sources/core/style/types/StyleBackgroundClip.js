"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleBackgroundClip = void 0;
class StyleBackgroundClip {
    constructor({ doesIncludeBorders = false, doesIncludePadding = false } = {}) {
        this.doesIncludeBorders = doesIncludeBorders;
        this.doesIncludePadding = doesIncludePadding;
    }
    serialize() {
        return null;
    }
    inspect() {
        return this.serialize();
    }
}
exports.StyleBackgroundClip = StyleBackgroundClip;
StyleBackgroundClip.borderBox = null;
StyleBackgroundClip.paddingBox = null;
StyleBackgroundClip.contentBox = null;
StyleBackgroundClip.borderBox = new StyleBackgroundClip({
    doesIncludeBorders: true,
    doesIncludePadding: true,
});
StyleBackgroundClip.borderBox.serialize = () => `borderBox`;
StyleBackgroundClip.paddingBox = new StyleBackgroundClip({ doesIncludePadding: true });
StyleBackgroundClip.paddingBox.serialize = () => `paddingBox`;
StyleBackgroundClip.contentBox = new StyleBackgroundClip();
StyleBackgroundClip.contentBox.serialize = () => `contentBox`;
