import * as Yoga from 'typeflex'

function diff(a, b) {
	if (typeof a == 'object') {
		const res = {}
		Object.entries(a).forEach(([key, value]) => {
			const difference = diff(a[key], b[key])
			if (difference !== undefined) {
				res[key] = difference
			}
		})
		if (Object.keys(res).length == 0) return undefined
		return res
	} else {
		if (a != b) {
			return b
		}
	}
}

export function debugYoga(node: any, cleanNode = Yoga.Node.create().node) {

	if ('node' in node) return debugYoga(node.node, cleanNode)

	const res = { id: node.id } as any
	if (node.children_.length > 0) {
		res.children = node.children_.map(child => debugYoga(child, cleanNode))
	}
	res.style = diff(cleanNode.style_, node.style_)
	return res
}
