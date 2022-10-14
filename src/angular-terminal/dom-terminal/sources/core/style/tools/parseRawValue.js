"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRawValue = void 0;
const lodash_1 = require("lodash");
function parseRawValue(rawValue, parser) {
    if (parser instanceof Map) {
        return parser.get(rawValue);
    }
    if (lodash_1.isArray(parser)) {
        let value;
        for (let t = 0; lodash_1.isUndefined(value) && t < parser.length; ++t)
            value = parseRawValue(rawValue, parser[t]);
        return value;
    }
    if (lodash_1.isPlainObject(parser)) {
        if (!lodash_1.isString(rawValue))
            return undefined;
        let camelized = lodash_1.camelCase(rawValue);
        if (Object.prototype.hasOwnProperty.call(parser, camelized)) {
            return parser[rawValue];
        }
        else {
            return undefined;
        }
    }
    if (lodash_1.isFunction(parser)) {
        return parser(rawValue);
    }
    if (parser === rawValue) {
        return rawValue;
    }
}
exports.parseRawValue = parseRawValue;
