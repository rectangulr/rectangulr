import * as _ from 'lodash-es'

import { parsePropertyValue } from './tools/parsePropertyValue'
import { parseSelector } from './tools/parseSelector'
import { serializePropertyValue } from './tools/serializePropertyValue'
import { styles } from './styleProperties'
import { Ruleset } from './Ruleset'

export function EasyStyle(ruleset: Ruleset, selector = [], base = Object.create(null)) {
  let { assign, get } = ruleset.when(new Set(selector))

  return new Proxy(base, {
    ownKeys(target) {
      return Reflect.ownKeys(styles)
    },

    has(target, key) {
      return _.has(styles, key)
    },

    get(target, key: string, receiver) {
      if (_.has(base, key)) return base[key]

      if (String(key).startsWith('toJSON')) {
        return {}
      }
      if (!_.has(styles, key))
        throw new Error(
          `Failed to get a style property: '${key}' is not a valid style property name. ${typeof base} ${JSON.stringify(
            Object.keys(base)
          )}`
        )

      return serializePropertyValue(get(key))
    },

    set(target, key: string, value, receiver) {
      if (!_.has(styles, key))
        throw new Error(
          `Failed to set a style property: '${key}' is not a valid style property name.`
        )

      if (_.has(styles[key], `setter`)) {
        // @ts-ignore
        styles[key].setter(receiver, parsePropertyValue(key, value))
      } else if (!_.isUndefined(value)) assign(new Map([[key, parsePropertyValue(key, value)]]))
      else assign(new Map([[key, undefined]]))

      return true
    },

    deleteProperty(target, key) {
      if (!_.has(styles, key))
        throw new Error(
          `Failed to delete a style property: '${String(key)}' is not a valid style property name.`
        )

      assign(new Map([[key, undefined]]))

      return true
    },
  })
}
