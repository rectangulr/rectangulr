import * as _ from 'lodash-es'
import { EasyStyle } from './EasyStyle'
import { Ruleset } from './Ruleset'
import { styles } from './styleProperties'

let globalRuleset = new Ruleset()
let globalStyle = EasyStyle(globalRuleset)

for (let key of Reflect.ownKeys(styles)) {
  if (!('initial' in styles[String(key)])) continue

  globalStyle[key] = styles[String(key)].initial
}

export { globalRuleset }
