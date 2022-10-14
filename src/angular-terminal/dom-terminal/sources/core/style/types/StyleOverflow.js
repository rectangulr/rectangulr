"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleOverflow = void 0;
class StyleOverflow {
    constructor({ doesHideOverflow = false } = {}) {
        this.doesHideOverflow = doesHideOverflow;
    }
    serialize() {
        return null;
    }
    inspect() {
        return this.serialize();
    }
}
exports.StyleOverflow = StyleOverflow;
StyleOverflow.visible = null;
StyleOverflow.hidden = null;
StyleOverflow.visible = new StyleOverflow();
StyleOverflow.visible.serialize = () => `visible`;
StyleOverflow.hidden = new StyleOverflow({ doesHideOverflow: true });
StyleOverflow.hidden.serialize = () => `hidden`;
