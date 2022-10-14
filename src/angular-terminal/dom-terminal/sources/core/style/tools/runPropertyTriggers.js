"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPropertyTriggers = void 0;
const lodash_1 = require("lodash");
const styleProperties_1 = require("../styleProperties");
function runPropertyTriggers(name, node, newValue, oldValue) {
    if (!Object.prototype.hasOwnProperty.call(styleProperties_1.styleProperties, name))
        throw new Error(`Failed to run property triggers: '${name}' is not a valid style property name.`);
    let property = styleProperties_1.styleProperties[name];
    if (lodash_1.isUndefined(property.triggers))
        return;
    for (let trigger of property.triggers) {
        trigger(node, newValue, oldValue);
    }
}
exports.runPropertyTriggers = runPropertyTriggers;
