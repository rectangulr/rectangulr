import { style } from '@manaflair/term-strings'
import { IStyle } from "../../../../../components/1-basics/style"

export namespace Position {
	export function isAbsolutelyPositioned(value: IStyle['position']) {
		switch (value) {
			case "absolute": return true
			case "fixed": return true
			default: return false
		}
	}
}

export namespace Color {

	export function front(value): string {
		return style.color.front(value).in
	}

	export function back(value): string {
		return style.color.back(value).in
	}
}

export namespace BackgroundClip {

	export function doesIncludeBorders(value) {
		switch (value) {
			case "borderBox": return true
			case "paddingBox": return true
			case "contentBox": return false
			default: {
				debugger
				throw new Error('doesIncludeBorders: invalid value')
			}
		}
	}
}
