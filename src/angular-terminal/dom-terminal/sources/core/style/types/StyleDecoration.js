"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleDecoration = void 0;
class StyleDecoration {
    constructor(name, { isUnderlined = false } = {}) {
        this.name = name;
        this.isUnderlined = isUnderlined;
    }
    serialize() {
        return this.name;
    }
    inspect() {
        return this.serialize();
    }
}
exports.StyleDecoration = StyleDecoration;
StyleDecoration.underline = null;
StyleDecoration.underline = new StyleDecoration(`underline`, { isUnderlined: true });
