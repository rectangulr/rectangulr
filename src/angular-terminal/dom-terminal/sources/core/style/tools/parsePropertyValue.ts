import * as _ from '@s-libs/micro-dash'
import { styleProperties } from '../styleProperties'
import { parseRawValue } from './parseRawValue'

export function parsePropertyValue(propertyName, rawValue) {
  if (!(propertyName in styleProperties)) {
    throw new Error(`Failed to parse a style property: '${propertyName}' is not a valid style property.`)
  }

  let property = styleProperties[propertyName]

  if (_.isUndefined(property.parsers)) {
    throw new Error(`Failed to parse a style property: '${propertyName}' has no declared parser.`)
  }

  if (rawValue === `inherit`) {
    return 'inherit'
  }

  let styleValue = parseRawValue(rawValue, property.parsers)

  if (_.isUndefined(styleValue)) {
    throw new Error(`Failed to parse a style property: '${rawValue}' is not a valid value for property '${propertyName}'.`)
  }

  return styleValue
}
