"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EasyComputedStyle = void 0;
const lodash_1 = require("lodash");
const styleProperties_1 = require("./styleProperties");
function EasyComputedStyle(computed, base = Object.create(null)) {
    return new Proxy(base, {
        ownKeys(target) {
            return Reflect.ownKeys(styleProperties_1.styleProperties);
        },
        has(target, key) {
            return lodash_1.has(styleProperties_1.styleProperties, key);
        },
        get(target, key) {
            if (lodash_1.has(styleProperties_1.styleProperties, key)) {
                return computed.get(key);
            }
            else if (key == 'keys') {
                return Object.fromEntries(computed);
            }
        },
    });
}
exports.EasyComputedStyle = EasyComputedStyle;
