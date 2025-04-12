import { TermElement } from '../../dom/TermElement'
import { dirtyLayout } from '../styleTriggers'
import { parseFlexJustify } from './parseFlexAlignment'


const parseJustifyContent = parseFlexJustify

export const StyleJustifyContent = {
	parsers: [parseJustifyContent],
	triggers: [dirtyLayout, setJustifyContent],
	initial: 'flexStart',
}

type Parsed = ReturnType<typeof parseJustifyContent>

export function setJustifyContent(el: TermElement, value: Parsed) {
	el.yogaNode.setJustifyContent(value)
}
