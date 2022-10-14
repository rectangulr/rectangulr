"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleWeight = void 0;
class StyleWeight {
    constructor(size) {
        this.size = size;
    }
    serialize() {
        return this.size;
    }
    valueOf() {
        return this.size;
    }
    inspect() {
        return this.serialize();
    }
}
exports.StyleWeight = StyleWeight;
StyleWeight.normal = null;
StyleWeight.bold = null;
StyleWeight.normal = new StyleWeight(400);
StyleWeight.normal.serialize = () => `normal`;
StyleWeight.bold = new StyleWeight(700);
StyleWeight.bold.serialize = () => `bold`;
