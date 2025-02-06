import { isArray, mergeWith } from "lodash-es"

export function mergeDeep(object, other) {
	function customizer(objValue, srcValue) {
		if (isArray(objValue)) {
			return objValue.concat(srcValue)
		}
	}

	return mergeWith(object, other, customizer)
}

