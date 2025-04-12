import { TermElement } from "../../../dom/TermElement"
import { Yoga } from "../../../layout/typeflex"
import { dirtyLayout } from "../../styleTriggers"
import { parseValueOrUndefined, ValueOrUndefined } from "./parse"

const parsePosition = parseValueOrUndefined

// LEFT

export const left = {
	parsers: [parsePosition],
	triggers: [dirtyLayout, setPositionLeft],
	initial: 'auto',
}

export function setPositionLeft(el: TermElement, value: ValueOrUndefined) {
	el.yogaNode.setPosition(Yoga.YGEdge.Left, value)
}

// RIGHT

export const right = {
	parsers: [parsePosition],
	triggers: [dirtyLayout, setPositionRight],
	initial: 'auto',
}

export function setPositionRight(el: TermElement, value: ValueOrUndefined) {
	el.yogaNode.setPosition(Yoga.YGEdge.Right, value)
}

// TOP

export const top = {
	parsers: [parsePosition],
	triggers: [dirtyLayout, setPositionTop],
	initial: 'auto',
}

export function setPositionTop(el: TermElement, value: ValueOrUndefined) {
	el.yogaNode.setPosition(Yoga.YGEdge.Top, value)
}

// BOTTOM

export const bottom = {
	parsers: [parsePosition],
	triggers: [dirtyLayout, setPositionBottom],
	initial: 'auto',
}

export function setPositionBottom(el: TermElement, value: ValueOrUndefined) {
	el.yogaNode.setPosition(Yoga.YGEdge.Bottom, value)
}
