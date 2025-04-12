import { TermElement } from '../../dom/TermElement'
import { DISPLAY_FLEX, DISPLAY_NONE } from '../../layout/typeflex/api'
import { dirtyLayout } from '../styleTriggers'

export type DISPLAY_VALUE = typeof DISPLAY_FLEX | typeof DISPLAY_NONE

export const StyleDisplay = {
  parsers: [parseDisplay],
  triggers: [dirtyLayout, setDisplay],
  initial: 'flex',
  default: 'flex',
}

export function parseDisplay(rawValue: 'flex' | 'none'): DISPLAY_VALUE {
  switch (rawValue) {
    case 'flex':
      return DISPLAY_FLEX
    case 'none':
      return DISPLAY_NONE
    default:
      throw new Error(`Invalid display value: ${rawValue}`)
  }
}

export function setDisplay(el: TermElement, value: DISPLAY_VALUE) {
  el.yogaNode.setDisplay(value)
}
