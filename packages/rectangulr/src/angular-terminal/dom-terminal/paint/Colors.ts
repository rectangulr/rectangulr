import { colorNames } from "../style/colorNames"

export type HexColor = `#${string}` | undefined

export function colorToHex(color: string): HexColor {
	if (color == undefined) {
		return undefined
	} else if (color.startsWith('#')) {
		return color as `#${string}`
	} else if (color in colorNames) {
		const hex = colorNames[color]
		return hex
	} else {
		throw new Error(`Unknown color: ${color}`)
	}
}