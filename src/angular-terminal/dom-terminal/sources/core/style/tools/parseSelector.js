"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSelector = void 0;
const lodash_1 = require("lodash");
function parseSelector(selector) {
    if (lodash_1.isNull(selector))
        return new Set();
    if (!lodash_1.isString(selector))
        throw new Error(`Failed to execute 'parseSelector': Parameter 1 is not a string.`);
    if (!selector.match(/^(:[a-z]+([A-Z][a-z]+)*)+$/))
        throw new Error(`Failed to execute 'parseSelector': '${selector}' is not a valid selector.`);
    return new Set(selector.match(/[a-zA-Z]+/g));
}
exports.parseSelector = parseSelector;
