import { TermElement } from "../../../dom/TermElement"
import { Yoga } from "../../../layout/typeflex"
import { dirtyLayout } from "../../styleTriggers"
import { parseValue } from "./parse"

export const StylePaddingLeft = {
	parsers: [parseValue],
	triggers: [dirtyLayout, setPaddingLeft],
	initial: 0,
}

export function setPaddingLeft(el: TermElement, value: number) {
	el.yogaNode.setPadding(Yoga.EDGE_LEFT, value)
}

export const StylePaddingRight = {
	parsers: [parseValue],
	triggers: [dirtyLayout, setPaddingRight],
	initial: 0,
}

export function setPaddingRight(el: TermElement, value: number) {
	el.yogaNode.setPadding(Yoga.EDGE_RIGHT, value)
}

export const StylePaddingTop = {
	parsers: [parseValue],
	triggers: [dirtyLayout, setPaddingTop],
	initial: 0,
}

export function setPaddingTop(el: TermElement, value: number) {
	el.yogaNode.setPadding(Yoga.EDGE_TOP, value)
}

export const StylePaddingBottom = {
	parsers: [parseValue],
	triggers: [dirtyLayout, setPaddingBottom],
	initial: 0,
}

export function setPaddingBottom(el: TermElement, value: number) {
	el.yogaNode.setPadding(Yoga.EDGE_BOTTOM, value)
}
