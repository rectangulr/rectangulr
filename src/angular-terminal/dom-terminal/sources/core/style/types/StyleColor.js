"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleColor = void 0;
const term_strings_1 = require("@manaflair/term-strings");
const lodash_1 = require("lodash");
class StyleColor {
    constructor(name) {
        this.name = name;
        Reflect.defineProperty(this, `front`, {
            get: lodash_1.memoize(() => term_strings_1.style.color.front(this.name).in),
            enumerable: false,
        });
        Reflect.defineProperty(this, `back`, {
            get: lodash_1.memoize(() => term_strings_1.style.color.back(this.name).in),
            enumerable: false,
        });
    }
    serialize() {
        return this.name;
    }
    inspect() {
        return this.serialize();
    }
}
exports.StyleColor = StyleColor;
