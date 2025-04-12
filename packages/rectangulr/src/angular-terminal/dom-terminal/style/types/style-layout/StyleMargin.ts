import { TermElement } from "../../../dom/TermElement"
import { Yoga } from "../../../layout/typeflex"
import { dirtyLayout } from "../../styleTriggers"
import { ValueOrAuto, parseValueOrAuto } from "./parse"

const parseMargin = parseValueOrAuto

// LEFT

export const left = {
	parsers: [parseMargin],
	triggers: [dirtyLayout, setMarginLeft],
	initial: 0,
}

export function setMarginLeft(el: TermElement, value: ValueOrAuto) {
	el.yogaNode.setMargin(Yoga.YGEdge.Left, value)
}

// RIGHT

export const right = {
	parsers: [parseMargin],
	triggers: [dirtyLayout, setMarginRight],
	initial: 0,
}

export function setMarginRight(el: TermElement, value: ValueOrAuto) {
	el.yogaNode.setMargin(Yoga.YGEdge.Right, value)
}

// TOP

export const top = {
	parsers: [parseMargin],
	triggers: [dirtyLayout, setMarginTop],
	initial: 0,
}

export function setMarginTop(el: TermElement, value: ValueOrAuto) {
	el.yogaNode.setMargin(Yoga.YGEdge.Top, value)
}

// BOTTOM

export const bottom = {
	parsers: [parseMargin],
	triggers: [dirtyLayout, setMarginBottom],
	initial: 0,
}

export function setMarginBottom(el: TermElement, value: ValueOrAuto) {
	el.yogaNode.setMargin(Yoga.YGEdge.Bottom, value)
}
