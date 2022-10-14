"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePropertyValue = void 0;
const lodash_1 = require("lodash");
const StyleInherit_1 = require("../types/StyleInherit");
const styleProperties_1 = require("../styleProperties");
const parseRawValue_1 = require("./parseRawValue");
function parsePropertyValue(propertyName, rawValue) {
    if (!lodash_1.has(styleProperties_1.styleProperties, propertyName))
        throw new Error(`Failed to parse a style property: '${propertyName}' is not a valid style property.`);
    let property = styleProperties_1.styleProperties[propertyName];
    if (lodash_1.isUndefined(property.parsers))
        throw new Error(`Failed to parse a style property: '${propertyName}' has no declared parser.`);
    if (rawValue === `inherit`)
        return StyleInherit_1.StyleInherit.inherit;
    let styleValue = parseRawValue_1.parseRawValue(rawValue, property.parsers);
    if (lodash_1.isUndefined(styleValue))
        throw new Error(`Failed to parse a style property: '${rawValue}' is not a valid value for property '${propertyName}'.`);
    return styleValue;
}
exports.parsePropertyValue = parsePropertyValue;
