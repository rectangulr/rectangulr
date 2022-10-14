"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleManager = void 0;
const core_decorators_1 = require("core-decorators");
const lodash_1 = require("lodash");
const getSpecificity_1 = require("./tools/getSpecificity");
const parsePropertyValue_1 = require("./tools/parsePropertyValue");
const parseSelector_1 = require("./tools/parseSelector");
const runPropertyTriggers_1 = require("./tools/runPropertyTriggers");
const serializePropertyValue_1 = require("./tools/serializePropertyValue");
const StyleInherit_1 = require("./types/StyleInherit");
const ClassList_1 = require("./ClassList");
const EasyComputedStyle_1 = require("./EasyComputedStyle");
const EasyStyle_1 = require("./EasyStyle");
const Ruleset_1 = require("./Ruleset");
const styleProperties_1 = require("./styleProperties");
class StyleManager {
    constructor(element) {
        this.element = element;
        this.states = new Set();
        this.nativeRulesets = new Set();
        this.userRulesets = new Set();
        this.localRuleset = new Ruleset_1.Ruleset();
        this.localRuleset.addEventListener(`change`, this.handleRulesetChange);
        this.stylePasses = [this.nativeRulesets, this.userRulesets, [this.localRuleset]];
        this.inherited = new Set();
        this.computed = new Map();
    }
    getClassList() {
        return new ClassList_1.ClassList(this);
    }
    getStyle() {
        let localRuleset = this.localRuleset;
        return EasyStyle_1.EasyStyle(localRuleset, [], {
            $: EasyComputedStyle_1.EasyComputedStyle(this.computed),
            assign(propertyValues) {
                Object.assign(this, propertyValues);
            },
            when(selector) {
                return EasyStyle_1.EasyStyle(localRuleset, parseSelector_1.parseSelector(selector), {
                    assign(propertyValues) {
                        Object.assign(this, propertyValues);
                    },
                });
            },
        });
    }
    setStateStatus(state, status) {
        if (status) {
            if (this.states.has(state))
                return;
            this.states.add(state);
        }
        else {
            if (!this.states.has(state))
                return;
            this.states.delete(state);
        }
        let dirtyProperties = new Set();
        for (let rulesets of this.stylePasses) {
            for (let ruleset of rulesets) {
                for (let { states, propertyValues } of ruleset.rules) {
                    if (!states.has(state))
                        continue;
                    for (let propertyName of propertyValues.keys()) {
                        dirtyProperties.add(propertyName);
                    }
                }
            }
        }
        this.refresh(dirtyProperties);
    }
    setRulesets(rulesets, target = StyleManager.RULESET_USER) {
        if (target !== StyleManager.RULESET_USER)
            throw new Error(`Failed to execute 'setRulesets': Invalid target.`);
        let current = Array.from(this.userRulesets);
        let next = Array.from(rulesets);
        let skipCurrent = 0;
        let skipNext = 0;
        while (skipCurrent < current.length && skipNext < next.length) {
            if (!current[skipCurrent]) {
                skipCurrent += 1;
            }
            else if (current[skipCurrent] === next[skipNext]) {
                skipCurrent += 1;
                skipNext += 1;
            }
            else {
                break;
            }
        }
        let dirtyPropertyNames = new Set();
        for (let t = skipCurrent; t < current.length; ++t) {
            let ruleset = current[t];
            if (!ruleset)
                continue;
            this.userRulesets.delete(ruleset);
            let propertyNames = ruleset.keys();
            ruleset.removeEventListener(`change`, this.handleRulesetChange);
            for (let propertyName of propertyNames) {
                dirtyPropertyNames.add(propertyName);
            }
        }
        for (let t = skipNext; t < next.length; ++t) {
            let ruleset = next[t];
            if (!ruleset)
                continue;
            this.userRulesets.add(ruleset);
            let propertyNames = ruleset.keys();
            ruleset.addEventListener(`change`, this.handleRulesetChange);
            for (let propertyName of propertyNames) {
                dirtyPropertyNames.add(propertyName);
            }
        }
        this.refresh(dirtyPropertyNames);
    }
    addRuleset(ruleset, target = StyleManager.RULESET_USER) {
        if (!ruleset)
            return;
        switch (target) {
            case StyleManager.RULESET_NATIVE:
                {
                    if (this.nativeRulesets.has(ruleset))
                        return;
                    if (this.userRulesets.has(ruleset))
                        throw new Error(`Failed to execute 'addRuleset': This ruleset already has been registered as a user ruleset.`);
                    this.nativeRulesets.add(ruleset);
                }
                break;
            case StyleManager.RULESET_USER:
                {
                    if (this.userRulesets.has(ruleset))
                        return;
                    if (this.nativeRulesets.has(ruleset))
                        throw new Error(`Failed to execute 'addRuleset': This ruleset already has been registered as a native ruleset.`);
                    this.userRulesets.add(ruleset);
                }
                break;
            default:
                {
                    throw new Error(`Failed to execute 'addRuleset': Cannot.`);
                }
                break;
        }
        let dirtyPropertyNames = ruleset.keys();
        ruleset.addEventListener(`change`, this.handleRulesetChange);
        this.refresh(dirtyPropertyNames);
    }
    removeRuleset(ruleset) {
        if (this.nativeRulesets.has(ruleset))
            throw new Error(`Failed to execute 'removeRuleset': Cannot remove a native ruleset.`);
        if (!this.userRulesets.has(ruleset))
            return;
        this.userRulesets.add(ruleset);
        let dirtyPropertyNames = ruleset.keys();
        ruleset.removeEventListener(`change`, this.handleRulesetChange);
        this.refresh(dirtyPropertyNames);
    }
    handleRulesetChange(e) {
        for (let state of e.states)
            if (!this.states.has(state))
                return;
        this.refresh(e.properties);
    }
    get(propertyName) {
        let value = undefined;
        for (let rulesets of this.stylePasses) {
            let specificity = -Infinity;
            for (let ruleset of rulesets) {
                ruleLoop: for (let { states, propertyValues } of ruleset.rules) {
                    if (!propertyValues.has(propertyName))
                        continue ruleLoop; // it doesn't have the property we're computing
                    if (states.size > this.states.size)
                        continue ruleLoop; // it cannot match anyway
                    let ruleSpecificity = getSpecificity_1.getSpecificity(states);
                    if (ruleSpecificity < specificity)
                        continue ruleLoop; // it has a lower specificity than ours
                    for (let state of states)
                        if (!this.states.has(state))
                            continue ruleLoop;
                    value = propertyValues.get(propertyName);
                    specificity = ruleSpecificity;
                }
            }
        }
        return value;
    }
    refresh(propertyNames, { inheritedOnly = false } = {}) {
        if (propertyNames.size === 0)
            return;
        let dirtyPropertyNames = new Set();
        for (let propertyName of propertyNames) {
            if (inheritedOnly && !this.inherited.has(propertyName))
                continue;
            let oldValue = this.computed.get(propertyName);
            let newValue = this.get(propertyName);
            if (newValue === StyleInherit_1.StyleInherit.inherit) {
                this.inherited.add(propertyName);
                if (this.element.parentNode) {
                    newValue = this.element.parentNode.style.$[propertyName];
                }
                else {
                    newValue = parsePropertyValue_1.parsePropertyValue(propertyName, styleProperties_1.styleProperties[propertyName].default);
                }
            }
            else {
                this.inherited.delete(propertyName);
            }
            if (!lodash_1.isEqual(serializePropertyValue_1.serializePropertyValue(newValue), serializePropertyValue_1.serializePropertyValue(oldValue))) {
                dirtyPropertyNames.add(propertyName);
                this.computed.set(propertyName, newValue);
                runPropertyTriggers_1.runPropertyTriggers(propertyName, this.element, newValue, oldValue);
            }
        }
        if (dirtyPropertyNames.size > 0) {
            for (let child of this.element.childNodes) {
                child.styleManager.refresh(dirtyPropertyNames, { inheritedOnly: true });
            }
        }
    }
}
StyleManager.RULESET_NATIVE = `RULESET_NATIVE`;
StyleManager.RULESET_USER = `RULESET_USER`;
__decorate([
    core_decorators_1.autobind
], StyleManager.prototype, "handleRulesetChange", null);
exports.StyleManager = StyleManager;
