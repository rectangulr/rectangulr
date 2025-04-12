import { dirtyLayout } from "../../styleTriggers"

export const StyleWhiteSpace = {
	parsers: [parseWhiteSpace],
	triggers: [dirtyLayout],
	initial: 'normal',
}

export type WhiteSpaceValue = 'normal' | 'noWrap' | 'pre' | 'preWrap' | 'preLine'

export function parseWhiteSpace(value: string): WhiteSpaceValue | undefined {
	const validValues = ['normal', 'noWrap', 'pre', 'preWrap', 'preLine']
	return validValues.includes(value) ? value as WhiteSpaceValue : undefined
}

const whiteSpaceSettings = {
	normal: {
		doesCollapse: true,
		doesDemoteNewlines: true,
		doesWrap: true
	},
	noWrap: {
		doesCollapse: true,
		doesDemoteNewlines: true,
		doesWrap: false
	},
	pre: {
		doesCollapse: false,
		doesDemoteNewlines: false,
		doesWrap: true
	},
	preWrap: {
		doesCollapse: false,
		doesDemoteNewlines: false,
		doesWrap: true
	},
	preLine: {
		doesCollapse: true,
		doesDemoteNewlines: false,
		doesWrap: true
	}
}
