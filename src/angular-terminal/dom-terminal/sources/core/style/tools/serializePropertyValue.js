"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializePropertyValue = void 0;
const lodash_1 = require("lodash");
function serializePropertyValue(value) {
    if (Array.isArray(value))
        return value.map(sub => serializePropertyValue(sub));
    if (lodash_1.isObject(value) && Reflect.has(value, `serialize`))
        return value.serialize();
    return value;
}
exports.serializePropertyValue = serializePropertyValue;
