import { TermElement } from '../../../dom/TermElement'
import { Yoga } from '../../../layout/typeflex'
import { dirtyLayout } from '../../styleTriggers'

export const StylePositionType = {
  parsers: [parsePosition],
  triggers: [dirtyLayout, setPosition],
  initial: 'relative',
}

export function parsePosition(value: string): Yoga.YGPositionType {
  switch (value) {
    case 'static':
      return Yoga.YGPositionType.Static
    case 'relative':
      return Yoga.YGPositionType.Relative
    case 'absolute':
      return Yoga.YGPositionType.Absolute
    default:
      throw new Error(`Invalid position value: ${value}`)
  }
}

export function setPosition(el: TermElement, value: Yoga.YGPositionType) {
  el.yogaNode.setPositionType(value)
}
