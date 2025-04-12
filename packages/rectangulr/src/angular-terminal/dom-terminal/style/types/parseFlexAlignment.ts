import { Yoga } from "../../layout/typeflex"

export function parseFlexAlignment(rawValue): Yoga.YGAlign {
	switch (rawValue) {
		case 'auto':
			return Yoga.YGAlign.Auto
		case 'flexStart':
			return Yoga.YGAlign.FlexStart
		case 'flexEnd':
			return Yoga.YGAlign.FlexEnd
		case 'center':
			return Yoga.YGAlign.Center
		case 'spaceBetween':
			return Yoga.YGAlign.SpaceBetween
		case 'spaceAround':
			return Yoga.YGAlign.SpaceAround
		case 'stretch':
			return Yoga.YGAlign.Stretch
		default:
			throw new Error(`Invalid flex alignment value: ${rawValue}`)
	}
}

export function parseFlexJustify(rawValue): Yoga.YGJustify {
	switch (rawValue) {
		case 'flexStart':
			return Yoga.YGJustify.FlexStart
		case 'flexEnd':
			return Yoga.YGJustify.FlexEnd
		case 'center':
			return Yoga.YGJustify.Center
		case 'spaceBetween':
			return Yoga.YGJustify.SpaceBetween
		case 'spaceAround':
			return Yoga.YGJustify.SpaceAround
		case 'spaceEvenly':
			return Yoga.YGJustify.SpaceEvenly
		default:
			throw new Error(`Invalid flex justify value: ${rawValue}`)
	}
}