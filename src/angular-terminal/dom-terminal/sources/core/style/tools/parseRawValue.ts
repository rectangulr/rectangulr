import _ from 'lodash'

export function parseRawValue(rawValue, parser) {
  if (parser instanceof Map) {
    return parser.get(rawValue)
  }

  if (_.isArray(parser)) {
    let value

    for (let t = 0; _.isUndefined(value) && t < parser.length; ++t)
      value = parseRawValue(rawValue, parser[t])

    return value
  }

  if (_.isPlainObject(parser)) {
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
