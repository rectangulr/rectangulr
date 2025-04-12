import * as _ from '@s-libs/micro-dash'
import { parseRawValue } from './parseRawValue'
import { styles } from './styleProperties'

export function parsePropertyValue(propertyName, rawValue) {
  if (!(propertyName in styles)) {
    throw new Error(`Failed to parse a style property: '${propertyName}' is not a valid style property.`)
  }

  let property = styles[propertyName]

  if (_.isUndefined(property.parsers)) {
    throw new Error(`Failed to parse a style property: '${propertyName}' has no declared parser.`)
  }

  if (rawValue === `inherit`) {
    return 'inherit'
  }

  let styleValue = parseRawValue(rawValue, property.parsers)

  // if (_.isUndefined(styleValue)) {
  //   throw new Error(`Failed to parse a style property: '${rawValue}' is not a valid value for property '${propertyName}'.`)
  // }

  return styleValue
}
