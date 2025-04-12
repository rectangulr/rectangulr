import { camelCase, isFunction, isString } from '@s-libs/micro-dash'

export function parseRawValue(rawValue, parser) {
  if (parser instanceof Map) {
    return parser.get(rawValue)
  }

  if (Array.isArray(parser)) {
    for (const p of parser) {
      const value = parseRawValue(rawValue, p)
      if (value !== undefined) {
        return value
      }
    }
    return undefined
  }

  if (parser && typeof parser == 'object') {
    if (!isString(rawValue)) return undefined

    let camelized = camelCase(rawValue)

    if (Object.prototype.hasOwnProperty.call(parser, camelized)) {
      return parser[rawValue]
    } else {
      return undefined
    }
  }

  if (isFunction(parser)) {
    return parser(rawValue)
  }

  if (parser === rawValue) {
    return rawValue
  }
}
