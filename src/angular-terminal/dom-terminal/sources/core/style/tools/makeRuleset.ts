import _ from 'lodash'

import { EasyStyle } from '../EasyStyle'
import { Ruleset } from '../Ruleset'
import { parseSelector } from './parseSelector'

// export function makeRuleset(value) {
//   return value
// }

// export function makeRuleset(...parts) {
//   let ruleset = new Ruleset()
//   let style = EasyStyle(ruleset)

//   for (let t = 0; t < parts.length; ++t) {
//     if (_.isString(parts[t])) {
//       style = EasyStyle(ruleset, parseSelector(parts[t]) as any)
//     } else if (_.isPlainObject(parts[t])) {
//       Object.assign(style, parts[t])
//     } else {
//       throw new Error(
//         `Failed to execute 'makeRuleset': Parameter ${
//           t + 1
//         } is not of type string, nor it is a plain object.`
//       )
//     }
//   }

//   return ruleset
// }
