import { TermElement } from '../../../dom/TermElement'
import { Yoga } from '../../../layout/typeflex'
import { dirtyLayout } from '../../styleTriggers'
import { parseFlexAlignment } from '../parseFlexAlignment'

export const StyleAlignContent = {
  parsers: [parseFlexAlignment],
  triggers: [dirtyLayout, setAlignContent],
  initial: 'flexStart',
  default: 'flexStart',
}

export function setAlignContent(el: TermElement, value: Yoga.YGAlign) {
  el.yogaNode.setAlignContent(value)
}

export const StyleAlignItems = {
  parsers: [parseFlexAlignment],
  triggers: [dirtyLayout, setFlexAlignItems],
  initial: 'flexStart',
}

export function setFlexAlignItems(el: TermElement, value: Yoga.YGAlign) {
  el.yogaNode.setAlignItems(value)
}

export const StyleAlignSelf = {
  parsers: [parseFlexAlignment],
  triggers: [dirtyLayout, setAlignSelf],
  initial: 'auto',
}

export function setAlignSelf(el: TermElement, value: Yoga.YGAlign) {
  el.yogaNode.setAlignSelf(value)
}


