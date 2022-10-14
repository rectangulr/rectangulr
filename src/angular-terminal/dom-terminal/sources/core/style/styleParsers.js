"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weight = exports.color = exports.character = exports.inherit = exports.length = exports.number = exports.repeat = exports.optional = exports.list = void 0;
const lodash_1 = require("lodash");
const colorNames_1 = require("./colorNames");
const parseRawValue_1 = require("./tools/parseRawValue");
const StyleColor_1 = require("./types/StyleColor");
const StyleInherit_1 = require("./types/StyleInherit");
const StyleLength_1 = require("./types/StyleLength");
const StyleWeight_1 = require("./types/StyleWeight");
class Optional {
    constructor(parsers) {
        this.parsers = parsers;
    }
}
function list(parserList) {
    let minSize = parserList.reduce((count, parser) => count + (parser instanceof Optional ? 0 : 1), 0);
    let maxSize = parserList.length;
    function iterate(parserList, rawValues) {
        if (rawValues.length === 0 && parserList.length === 0)
            return [];
        if (rawValues.length < minSize && parserList.length === 0)
            return undefined;
        if (parserList.length < minSize && rawValues.length === 0)
            return undefined;
        let rawValue = rawValues[0];
        let parserEntry = parserList[0];
        let isOptional = parserEntry instanceof Optional;
        let parsers = parserEntry instanceof Optional ? parserEntry.parsers : parserEntry;
        let value = parseRawValue_1.parseRawValue(rawValue, parsers);
        if (value === undefined && !isOptional)
            return undefined;
        let next = value !== undefined
            ? iterate(parserList.slice(1), rawValues.slice(1))
            : iterate(parserList.slice(1), rawValues);
        if (next !== undefined) {
            return [value, ...next];
        }
        else {
            return undefined;
        }
    }
    return rawValue => {
        rawValue = lodash_1.castArray(rawValue);
        if (rawValue.length < minSize)
            return undefined;
        if (rawValue.length > maxSize)
            return undefined;
        return iterate(parserList, rawValue);
    };
}
exports.list = list;
function optional(parsers) {
    return new Optional(parsers);
}
exports.optional = optional;
function repeat(n, parsers) {
    return rawValue => {
        rawValue = lodash_1.castArray(rawValue);
        if (!n.includes(rawValue.length))
            return undefined;
        let value = rawValue.map(sub => {
            return parseRawValue_1.parseRawValue(sub, parsers);
        });
        if (value.some(sub => lodash_1.isUndefined(sub)))
            return undefined;
        return value;
    };
}
exports.repeat = repeat;
function number(rawValue) {
    if (!lodash_1.isNumber(rawValue) && !lodash_1.isString(rawValue))
        return undefined;
    let value = Number(rawValue);
    if (!lodash_1.isFinite(value))
        return undefined;
    return value;
}
exports.number = number;
function length(rawValue) {
    if (rawValue instanceof StyleLength_1.StyleLength && !rawValue.isRelative)
        return rawValue;
    if (!lodash_1.isNumber(rawValue) && !lodash_1.isString(rawValue))
        return undefined;
    let value = Number(rawValue);
    if (!lodash_1.isFinite(value))
        return undefined;
    return new StyleLength_1.StyleLength(value);
}
exports.length = length;
length.rel = function (rawValue) {
    if (rawValue instanceof StyleLength_1.StyleLength && rawValue.isRelative)
        return rawValue;
    if (!lodash_1.isString(rawValue) || !rawValue.endsWith(`%`))
        return undefined;
    let value = Number(rawValue.slice(0, -1));
    if (!lodash_1.isFinite(value))
        return undefined;
    return new StyleLength_1.StyleLength(value, true);
};
length.autoNaN = function (rawValue) {
    if (rawValue !== `auto` && rawValue !== StyleLength_1.StyleLength.autoNaN)
        return undefined;
    return StyleLength_1.StyleLength.autoNaN;
};
length.auto = function (rawValue) {
    if (rawValue !== `auto` && rawValue !== StyleLength_1.StyleLength.auto)
        return undefined;
    return StyleLength_1.StyleLength.auto;
};
length.infinity = function (rawValue) {
    if (rawValue !== Infinity)
        return undefined;
    return StyleLength_1.StyleLength.infinity;
};
function inherit(rawValue) {
    if (rawValue !== `inherit`)
        return undefined;
    return StyleInherit_1.StyleInherit.inherit;
}
exports.inherit = inherit;
function character(rawValue) {
    if (!lodash_1.isString(rawValue) || rawValue.length !== 1)
        return undefined;
    return rawValue;
}
exports.character = character;
function color(rawValue) {
    if (rawValue instanceof StyleColor_1.StyleColor)
        return rawValue;
    if (!lodash_1.isString(rawValue))
        return undefined;
    rawValue = rawValue.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(colorNames_1.colorNames, rawValue))
        rawValue = colorNames_1.colorNames[rawValue];
    if (/^#[0-9a-f]{3}$/.test(rawValue))
        rawValue = rawValue.replace(/([0-9a-f])/g, `$1$1`);
    if (!/^#[0-9a-f]{6}$/.test(rawValue))
        return undefined;
    return new StyleColor_1.StyleColor(rawValue);
}
exports.color = color;
function weight(rawValue) {
    if (!lodash_1.isNumber(rawValue) && !lodash_1.isString(rawValue))
        return undefined;
    let value = Number(rawValue);
    if (!lodash_1.isFinite(value))
        return undefined;
    return new StyleWeight_1.StyleWeight(value);
}
exports.weight = weight;
