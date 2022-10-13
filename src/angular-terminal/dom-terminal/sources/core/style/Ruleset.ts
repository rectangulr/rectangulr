import { isUndefined } from 'lodash'

import { EventSource } from '../misc/EventSource'
import { Event } from '../misc/Event'

export class Ruleset {
    rules: any[]
    propertyNames: Map<any, any>
    assign: (propertyValues: any) => void

    constructor() {
        EventSource.setup(this)

        this.declareEvent(`change`)

        this.rules = []

        this.propertyNames = new Map()

        this.assign = this.when(new Set()).assign
    }

    declareEvent(arg0: string) {
        throw new Error('Method not implemented.')
    }

    addEventListener(arg0: string, handleRulesetChange: (e: any) => void) {
        throw new Error('Method not implemented.')
    }

    dispatchEvent(event: Event) {
        throw new Error('Method not implemented.')
    }

    removeEventListener(arg0: string, handleRulesetChange: (e: any) => void) {
        throw new Error('Method not implemented.')
    }

    keys() {
        return this.propertyNames.keys()
    }

    when(states) {
        if (!(states instanceof Set)) throw new Error('42')

        let rule = this.rules.find(rule => {
            if (states.size !== rule.states.size) return false

            for (let state of rule.states) if (!states.has(state)) return false

            return true
        })

        if (!rule) {
            rule = { states, propertyValues: new Map() }

            this.rules.push(rule)
        }

        return {
            keys: () => {
                return rule.propertyValues.keys()
            },

            get: (propertyName: string) => {
                return rule.propertyValues.get(propertyName)
            },

            assign: propertyValues => {
                let dirtyPropertyNames = new Set<string>()

                for (let [propertyName, newValue] of propertyValues) {
                    let oldValue = rule.propertyValues.get(propertyName)

                    if (newValue === oldValue) continue

                    if (!isUndefined(newValue)) rule.propertyValues.set(propertyName, newValue)
                    else rule.propertyValues.delete(propertyName)

                    let count = this.propertyNames.get(propertyName) || 0

                    if (!isUndefined(newValue)) count += 1
                    else count -= 1

                    if (count > 0) this.propertyNames.set(propertyName, count)
                    else this.propertyNames.delete(propertyName)

                    dirtyPropertyNames.add(propertyName)
                }

                if (dirtyPropertyNames.size > 0) {
                    let event = new Event(`change`)

                    event.states = rule.states
                    event.properties = dirtyPropertyNames

                    this.dispatchEvent(event)
                }
            },
        }
    }
}
