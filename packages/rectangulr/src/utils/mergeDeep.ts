import _ from "lodash"

export function mergeDeep(object, other) {
	function customizer(objValue, srcValue) {
		if (_.isArray(objValue)) {
			return objValue.concat(srcValue)
		}
	}

	return _.mergeWith(object, other, customizer)
}

