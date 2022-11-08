import _ from 'lodash'
import { EasyStyle } from './EasyStyle'
import { Ruleset } from './Ruleset'
import { styleProperties } from './styleProperties'

let globalRuleset = new Ruleset()
let globalStyle = EasyStyle(globalRuleset)

for (let key of Reflect.ownKeys(styleProperties)) {
  if (!_.has(styleProperties[String(key)], `initial`)) continue

  globalStyle[key] = styleProperties[String(key)].initial
}

export { globalRuleset }
