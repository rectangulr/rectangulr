import _ from 'lodash'

import { styles } from './styleProperties'

export function EasyComputedStyle(computed, base = Object.create(null)) {
  return new Proxy(base, {
    ownKeys(target) {
      return Reflect.ownKeys(styles)
    },

    has(target, key) {
      return _.has(styles, key)
    },

    get(target, key) {
      if (String(key).startsWith('toJSON')) {
        return {}
      }
      if (_.has(styles, key)) {
        return computed.get(key)
      } else if (key == 'keys') {
        return Object.fromEntries(computed)
      }
    },
  })
}
