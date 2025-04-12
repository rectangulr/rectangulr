import { cursor } from '../../../term-strings/core/index'
import { Color } from '../style/StyleHelpers'
import { assertUnreachable } from "../utils/AssertUnreachable"

export type AnsiCode =
	{ type: 'moveTo', x: number, y: number } |
	{ type: 'char', char: string } |
	{ type: 'clearStyle' } |
	{ type: 'fg', color: string | null } |
	{ type: 'bg', color: string | null } |
	{ type: 'bold' } |
	{ type: 'underline' }

function convertCodeToString(code: AnsiCode) {
	if (code.type == 'char') {
		return code.char
	} else if (code.type == 'moveTo') {
		return cursor.moveTo(code)
	} else if (code.type == 'fg') {
		if (code.color === null) {
			return `\x1b[39m`
		} else {
			return Color.front(code.color)
		}
	} else if (code.type == 'bg') {
		if (code.color === null) {
			return `\x1b[49m`
		} else {
			return Color.back(code.color)
		}
	} else if (code.type == 'clearStyle') {
		return `\x1b[0m`
	} else if (code.type == 'bold') {
		return '\x1b[1m'
	} else if (code.type == 'underline') {
		return '\x1b[4m'
	} else {
		assertUnreachable(code)
	}
}

export function ansiCodesToString(codes: Array<AnsiCode>) {
	let result = ''
	for (const code of codes) {
		result += convertCodeToString(code)
	}
	return result
}