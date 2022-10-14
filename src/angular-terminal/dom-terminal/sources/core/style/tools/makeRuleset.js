"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRuleset = void 0;
const lodash_1 = require("lodash");
const EasyStyle_1 = require("../EasyStyle");
const Ruleset_1 = require("../Ruleset");
const parseSelector_1 = require("./parseSelector");
function makeRuleset(...parts) {
    let ruleset = new Ruleset_1.Ruleset();
    let style = EasyStyle_1.EasyStyle(ruleset);
    for (let t = 0; t < parts.length; ++t) {
        if (lodash_1.isString(parts[t])) {
            style = EasyStyle_1.EasyStyle(ruleset, parseSelector_1.parseSelector(parts[t]));
        }
        else if (lodash_1.isPlainObject(parts[t])) {
            Object.assign(style, parts[t]);
        }
        else {
            throw new Error(`Failed to execute 'makeRuleset': Parameter ${t + 1} is not of type string, nor it is a plain object.`);
        }
    }
    return ruleset;
}
exports.makeRuleset = makeRuleset;
