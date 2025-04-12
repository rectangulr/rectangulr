import { AnyObject } from "../utils/utils"
import { Yoga } from "./dom-terminal/layout/typeflex"

export function diff(a: AnyObject | null, b: AnyObject | null): AnyObject | undefined {
	if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
		const res: AnyObject = {}
		Object.entries(a).forEach(([key, _]) => {
			const difference = diff(a[key] as AnyObject, b[key] as AnyObject)
			if (difference !== undefined) {
				res[key] = difference
			}
		})
		if (Object.keys(res).length == 0) return undefined
		return res
	} else {
		if (a != b) {
			return b as AnyObject
		}
	}
}

export function debugYoga(node: any, cleanNode = Yoga.Node.create()) {

	if ('node' in node) return debugYoga(node.node, cleanNode)

	const res = { id: node.id } as any
	if (node.children_.length > 0) {
		res.children = node.children_.map(child => debugYoga(child, cleanNode))
	}
	// @ts-ignore
	res.style = diff(cleanNode.node.style_, node.style_)
	return res
}
