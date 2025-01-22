import * as _ from 'lodash-es'

export function parseRawValue(rawValue, parser) {
  if (parser instanceof Map) {
    return parser.get(rawValue)
  }

  if (_.isArray(parser)) {
    for (const p of parser) {
      const value = parseRawValue(rawValue, p)
      if (value !== undefined) {
        return value
      }
    }
    return undefined
  }

  if (parser && typeof parser == 'object') {
    if (!_.isString(rawValue)) return undefined

    let camelized = _.camelCase(rawValue)

    if (Object.prototype.hasOwnProperty.call(parser, camelized)) {
      return parser[rawValue]
    } else {
      return undefined
    }
  }

  if (_.isFunction(parser)) {
    return parser(rawValue)
  }

  if (parser === rawValue) {
    return rawValue
  }
}
