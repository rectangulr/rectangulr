import _ from 'lodash'

import { styles } from '../styleProperties'

export function runPropertyTriggers(name, node, newValue, oldValue) {
  if (!Object.prototype.hasOwnProperty.call(styles, name))
    throw new Error(
      `Failed to run property triggers: '${name}' is not a valid style property name.`
    )

  let property = styles[name]

  if (_.isUndefined(property.triggers)) return

  for (let trigger of property.triggers) {
    trigger(node, newValue, oldValue)
  }
}
