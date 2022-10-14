"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EasyStyle = void 0;
const lodash_1 = require("lodash");
const parsePropertyValue_1 = require("./tools/parsePropertyValue");
const serializePropertyValue_1 = require("./tools/serializePropertyValue");
const styleProperties_1 = require("./styleProperties");
function EasyStyle(ruleset, selector = [], base = Object.create(null)) {
    let { assign, get } = ruleset.when(new Set(selector));
    return new Proxy(base, {
        ownKeys(target) {
            return Reflect.ownKeys(styleProperties_1.styleProperties);
        },
        has(target, key) {
            return lodash_1.has(styleProperties_1.styleProperties, key);
        },
        get(target, key, receiver) {
            if (lodash_1.has(base, key))
                return base[key];
            if (!lodash_1.has(styleProperties_1.styleProperties, key))
                throw new Error(`Failed to get a style property: '${key}' is not a valid style property name. ${typeof base} ${JSON.stringify(Object.keys(base))}`);
            return serializePropertyValue_1.serializePropertyValue(get(key));
        },
        set(target, key, value, receiver) {
            if (!lodash_1.has(styleProperties_1.styleProperties, key))
                throw new Error(`Failed to set a style property: '${key}' is not a valid style property name.`);
            if (lodash_1.has(styleProperties_1.styleProperties[key], `setter`))
                styleProperties_1.styleProperties[key].setter(receiver, parsePropertyValue_1.parsePropertyValue(key, value));
            else if (!lodash_1.isUndefined(value))
                assign(new Map([[key, parsePropertyValue_1.parsePropertyValue(key, value)]]));
            else
                assign(new Map([[key, undefined]]));
            return true;
        },
        deleteProperty(target, key) {
            if (!lodash_1.has(styleProperties_1.styleProperties, key))
                throw new Error(`Failed to delete a style property: '${String(key)}' is not a valid style property name.`);
            assign(new Map([[key, undefined]]));
            return true;
        },
    });
}
exports.EasyStyle = EasyStyle;
