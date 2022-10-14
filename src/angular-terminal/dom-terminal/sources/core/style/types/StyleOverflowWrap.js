"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleOverflowWrap = void 0;
class StyleOverflowWrap {
    constructor({ doesBreakWords = false } = {}) {
        this.doesBreakWords = doesBreakWords;
    }
    serialize() {
        return null;
    }
    inspect() {
        return this.serialize();
    }
}
exports.StyleOverflowWrap = StyleOverflowWrap;
StyleOverflowWrap.normal = null;
StyleOverflowWrap.breakWord = null;
StyleOverflowWrap.normal = new StyleOverflowWrap();
StyleOverflowWrap.normal.serialize = () => `normal`;
StyleOverflowWrap.breakWord = new StyleOverflowWrap({ doesBreakWords: true });
StyleOverflowWrap.breakWord.serialize = () => `breakWord`;
