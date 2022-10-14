"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleInherit = void 0;
class StyleInherit {
    constructor() { }
    serialize() {
        return null;
    }
    inspect() {
        return this.serialize();
    }
}
exports.StyleInherit = StyleInherit;
StyleInherit.inherit = null;
StyleInherit.inherit = new StyleInherit();
StyleInherit.inherit.serialize = () => `inherit`;
