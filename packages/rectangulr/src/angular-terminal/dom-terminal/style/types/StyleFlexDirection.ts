import { TermElement } from '../../dom/TermElement'
import { Yoga } from '../../layout/typeflex/index'
import { dirtyLayout } from '../styleTriggers'

export const StyleFlexDirection = {
  parsers: [parseFlexDirection],
  triggers: [dirtyLayout, setFlexDirection],
  initial: 'column',
}

export function parseFlexDirection(rawValue: any): Yoga.YGFlexDirection {
  switch (rawValue) {
    case 'row': return Yoga.FLEX_DIRECTION_ROW
    case 'row-reverse': return Yoga.FLEX_DIRECTION_ROW_REVERSE
    case 'column': return Yoga.FLEX_DIRECTION_COLUMN
    case 'column-reverse': return Yoga.FLEX_DIRECTION_COLUMN_REVERSE
    default: throw new Error(`Invalid flex-direction value: ${rawValue}`)
  }
}

export function setFlexDirection(el: TermElement, value: Yoga.YGFlexDirection) {
  el.yogaNode.setFlexDirection(value)
}
