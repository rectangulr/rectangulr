import _ from 'lodash'

import { parsePropertyValue } from './tools/parsePropertyValue'
import { parseSelector } from './tools/parseSelector'
import { serializePropertyValue } from './tools/serializePropertyValue'
import { styleProperties } from './styleProperties'
import { Ruleset } from './Ruleset'

export function EasyStyle(ruleset: Ruleset, selector = [], base = Object.create(null)) {
  let { assign, get } = ruleset.when(new Set(selector))

  return new Proxy(base, {
    ownKeys(target) {
      return Reflect.ownKeys(styleProperties)
    },

    has(target, key) {
      return _.has(styleProperties, key)
    },

    get(target, key: string, receiver) {
      if (_.has(base, key)) return base[key]

      if (String(key).startsWith('toJSON')) {
        return {}
      }
      if (!_.has(styleProperties, key))
        throw new Error(
          `Failed to get a style property: '${key}' is not a valid style property name. ${typeof base} ${JSON.stringify(
            Object.keys(base)
          )}`
        )

      return serializePropertyValue(get(key))
    },

    set(target, key: string, value, receiver) {
      if (!_.has(styleProperties, key))
        throw new Error(
          `Failed to set a style property: '${key}' is not a valid style property name.`
        )

      if (_.has(styleProperties[key], `setter`))
        styleProperties[key].setter(receiver, parsePropertyValue(key, value))
      else if (!_.isUndefined(value)) assign(new Map([[key, parsePropertyValue(key, value)]]))
      else assign(new Map([[key, undefined]]))

      return true
    },

    deleteProperty(target, key) {
      if (!_.has(styleProperties, key))
        throw new Error(
          `Failed to delete a style property: '${String(key)}' is not a valid style property name.`
        )

      assign(new Map([[key, undefined]]))

      return true
    },
  })
}
