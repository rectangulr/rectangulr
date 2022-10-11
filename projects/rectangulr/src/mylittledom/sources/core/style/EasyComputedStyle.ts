import { has } from 'lodash'

import { styleProperties } from './styleProperties'

export function EasyComputedStyle(computed, base = Object.create(null)) {
  return new Proxy(base, {
    ownKeys(target) {
      return Reflect.ownKeys(styleProperties)
    },

    has(target, key) {
      return has(styleProperties, key)
    },

    get(target, key) {
      if (has(styleProperties, key)) {
        return computed.get(key)
      } else if (key == 'keys') {
        return Object.fromEntries(computed)
      }
    },
  })
}
