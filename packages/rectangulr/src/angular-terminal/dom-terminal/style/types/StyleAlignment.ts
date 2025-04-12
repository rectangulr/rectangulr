import { TermElement } from '../../dom/TermElement'
import { Yoga } from '../../layout/typeflex/index'
import { dirtyLayout } from '../styleTriggers'

export const StyleAlignment = {
  parsers: [parseAlignment],
  triggers: [dirtyLayout, setAlignment],
  initial: 'left',
}

export function parseAlignment(value: string): Yoga.YGAlign {
  switch (value) {
    case 'left': return Yoga.YGAlign.FlexStart
    case 'center': return Yoga.YGAlign.Center
    case 'right': return Yoga.YGAlign.FlexEnd
    case 'justify': return Yoga.YGAlign.Stretch
    default: throw new Error(`Invalid alignment value: ${value}`)
  }
}

export function setAlignment(el: TermElement, value: Yoga.YGAlign) {
  el.yogaNode.setAlignItems(value)
}
