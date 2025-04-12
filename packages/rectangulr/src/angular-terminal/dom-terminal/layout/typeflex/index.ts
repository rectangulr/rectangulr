import * as Yoga from './api'
export * as Yoga from './api'

export function debugYoga2(node: Yoga.Node) {
	const res = {
		justifyContent: Yoga.YGJustifyToString(node.getJustifyContent()),
		display: Yoga.YGDisplayToString(node.getDisplay()),
		position: Yoga.YGPositionTypeToString(node.getPositionType()),

		flexGrow: node.getFlexGrow(),
		flexShrink: node.getFlexShrink(),
		flexBasis: valueToString(node.getFlexBasis()),

		height: valueToString(node.getHeight()),
		width: valueToString(node.getWidth()),
		alignContent: Yoga.YGAlignToString(node.getAlignContent()),
		alignItems: Yoga.YGAlignToString(node.getAlignItems()),
		alignSelf: Yoga.YGAlignToString(node.getAlignSelf()),
	}
	return res
}

function valueToString(value: Yoga.Value) {
	return {
		unit: Yoga.YGUnitToString(value.unit),
		value: value.value
	}
}