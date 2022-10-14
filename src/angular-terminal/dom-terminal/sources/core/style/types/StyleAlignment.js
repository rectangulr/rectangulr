"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleAlignment = void 0;
class StyleAlignment {
    constructor(name, { isLeftAligned = false, isCentered = false, isRightAligned = false, isJustified = false } = {}) {
        this.name = name;
        this.isLeftAligned = isLeftAligned;
        this.isCentered = isCentered;
        this.isRightAligned = isRightAligned;
        this.isJustified = isJustified;
    }
    serialize() {
        return this.name;
    }
    inspect() {
        return this.serialize();
    }
}
exports.StyleAlignment = StyleAlignment;
StyleAlignment.left = null;
StyleAlignment.center = null;
StyleAlignment.right = null;
StyleAlignment.justify = null;
StyleAlignment.left = new StyleAlignment(`left`, { isLeftAligned: true });
StyleAlignment.center = new StyleAlignment(`center`, { isCentered: true });
StyleAlignment.right = new StyleAlignment(`right`, { isRightAligned: true });
StyleAlignment.justify = new StyleAlignment(`justify`, { isJustified: true });
