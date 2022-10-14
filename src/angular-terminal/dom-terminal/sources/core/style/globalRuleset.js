"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalRuleset = void 0;
const lodash_1 = require("lodash");
const EasyStyle_1 = require("./EasyStyle");
const Ruleset_1 = require("./Ruleset");
const styleProperties_1 = require("./styleProperties");
let globalRuleset = new Ruleset_1.Ruleset();
exports.globalRuleset = globalRuleset;
let globalStyle = EasyStyle_1.EasyStyle(globalRuleset);
for (let key of Reflect.ownKeys(styleProperties_1.styleProperties)) {
    if (!lodash_1.has(styleProperties_1.styleProperties[String(key)], `initial`))
        continue;
    globalStyle[key] = styleProperties_1.styleProperties[String(key)].initial;
}
