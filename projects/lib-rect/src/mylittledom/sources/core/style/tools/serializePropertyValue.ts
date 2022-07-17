import { isObject } from 'lodash'

export function serializePropertyValue(value: { serialize: () => string }) {
  if (Array.isArray(value)) return value.map(sub => serializePropertyValue(sub))

  if (isObject(value) && Reflect.has(value, `serialize`)) return value.serialize()

  return value
}
