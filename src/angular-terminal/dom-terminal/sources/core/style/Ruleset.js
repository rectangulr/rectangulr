"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ruleset = void 0;
const lodash_1 = require("lodash");
const EventSource_1 = require("../misc/EventSource");
const Event_1 = require("../misc/Event");
class Ruleset {
    constructor() {
        EventSource_1.EventSource.setup(this);
        this.declareEvent(`change`);
        this.rules = [];
        this.propertyNames = new Map();
        this.assign = this.when(new Set()).assign;
    }
    declareEvent(arg0) {
        throw new Error('Method not implemented.');
    }
    addEventListener(arg0, handleRulesetChange) {
        throw new Error('Method not implemented.');
    }
    dispatchEvent(event) {
        throw new Error('Method not implemented.');
    }
    removeEventListener(arg0, handleRulesetChange) {
        throw new Error('Method not implemented.');
    }
    keys() {
        return this.propertyNames.keys();
    }
    when(states) {
        if (!(states instanceof Set))
            throw new Error('42');
        let rule = this.rules.find(rule => {
            if (states.size !== rule.states.size)
                return false;
            for (let state of rule.states)
                if (!states.has(state))
                    return false;
            return true;
        });
        if (!rule) {
            rule = { states, propertyValues: new Map() };
            this.rules.push(rule);
        }
        return {
            keys: () => {
                return rule.propertyValues.keys();
            },
            get: (propertyName) => {
                return rule.propertyValues.get(propertyName);
            },
            assign: propertyValues => {
                let dirtyPropertyNames = new Set();
                for (let [propertyName, newValue] of propertyValues) {
                    let oldValue = rule.propertyValues.get(propertyName);
                    if (newValue === oldValue)
                        continue;
                    if (!lodash_1.isUndefined(newValue))
                        rule.propertyValues.set(propertyName, newValue);
                    else
                        rule.propertyValues.delete(propertyName);
                    let count = this.propertyNames.get(propertyName) || 0;
                    if (!lodash_1.isUndefined(newValue))
                        count += 1;
                    else
                        count -= 1;
                    if (count > 0)
                        this.propertyNames.set(propertyName, count);
                    else
                        this.propertyNames.delete(propertyName);
                    dirtyPropertyNames.add(propertyName);
                }
                if (dirtyPropertyNames.size > 0) {
                    let event = new Event_1.Event(`change`);
                    event.states = rule.states;
                    event.properties = dirtyPropertyNames;
                    this.dispatchEvent(event);
                }
            },
        };
    }
}
exports.Ruleset = Ruleset;
