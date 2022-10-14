"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleWhiteSpace = void 0;
class StyleWhiteSpace {
    constructor(name, { doesCollapse = false, doesDemoteNewlines = false, doesWrap = false } = {}) {
        this.name = name;
        this.doesCollapse = doesCollapse;
        this.doesDemoteNewlines = doesDemoteNewlines;
        this.doesWrap = doesWrap;
    }
    serialize() {
        return this.name;
    }
    inspect() {
        return this.serialize();
    }
}
exports.StyleWhiteSpace = StyleWhiteSpace;
StyleWhiteSpace.normal = null;
StyleWhiteSpace.noWrap = null;
StyleWhiteSpace.pre = null;
StyleWhiteSpace.preWrap = null;
StyleWhiteSpace.preLine = null;
StyleWhiteSpace.normal = new StyleWhiteSpace(`normal`, {
    doesCollapse: true,
    doesDemoteNewlines: true,
    doesWrap: true,
});
StyleWhiteSpace.noWrap = new StyleWhiteSpace(`noWrap`, {
    doesCollapse: true,
    doesDemoteNewlines: true,
});
StyleWhiteSpace.pre = new StyleWhiteSpace(`pre`, {});
StyleWhiteSpace.preWrap = new StyleWhiteSpace(`preWrap`, { doesWrap: true });
StyleWhiteSpace.preLine = new StyleWhiteSpace(`preLine`, { doesCollapse: true, doesWrap: true });
