import { Injector, Signal, effect, isSignal } from "@angular/core"
import { IStyle } from "../../../../../components/1-basics/style"
import { unwrapIfSignal } from "../../../../../utils/utils"
import { computedStyles, isComputedStyle, styleProperties } from "../style/styleProperties"
import { parsePropertyValue } from "../style/tools/parsePropertyValue"
import { Element } from './Element'

type StyleKey = keyof IStyle

type Layer = IStyle | Signal<IStyle>

export class StyleHandler {

	layers: Layer[] = []
	style: IStyle = {}
	onDestroy: (() => void)[] = []

	constructor(public element: Element, public injector: Injector) {
		this.retriggerLayer(styleProperties)
	}

	add(layer: Layer) {
		this.layers.push(layer)
		this.retriggerLayer(layer)

		if (isSignal(layer)) {
			const e = effect(() => {
				this.retriggerLayer(layer)
			}, { injector: this.injector, manualCleanup: true })
			this.onDestroy.push(() => e.destroy())
		}
	}

	retriggerLayer(layer: Layer) {
		const computedLayer = this.computeLayer(layer)

		for (const key of Object.keys(computedLayer)) {
			const propInfo = styleProperties[key]
			const rawValue = this.get(key as any)
			this.style[key as string] = rawValue
			// if (this.style[key] !== rawValue) {
			propInfo.triggers?.forEach(trigger => {
				const value = parsePropertyValue(key, rawValue)
				trigger(this.element, value, value)
			})
			// }
		}
	}

	computeLayer(layer: Layer): IStyle {
		layer = unwrapIfSignal(layer)

		let computedLayer = {}
		for (const [key, value] of Object.entries(layer)) {
			if (isComputedStyle(key)) {
				const transformFunction = computedStyles[key].setter
				Object.assign(computedLayer, transformFunction(this, value))
			} else {
				computedLayer[key] = value
			}
		}
		return computedLayer
	}

	// remove(layer: Layer) {
	// 	_.remove(this.layers, s => s == layer)
	// 	this.retriggerLayer(Object.keys(layer) as any)
	// 	if (isSignal(layer)) {
	// 		// unsubscribe style changes
	// 	}
	// }

	get<K extends StyleKey>(propName: K): IStyle[K] {
		const prop = styleProperties[propName]

		let value = this.getFromLayers(propName, this.layers)

		if (value === undefined && prop.initial !== undefined) {
			value = prop.initial
		}

		if (value === 'inherit') {
			if (this.element.parentNode) {
				value = this.element.parentNode.style.get(propName)
			} else {
				value = styleProperties[propName].default
			}
		}

		value = unwrapIfSignal(value)

		// if (value === undefined) {
		// 	value = prop.default
		// }

		return value
	}

	getFromLayers(prop: string, layers: typeof this.layers) {
		for (let i = layers.length - 1; i >= 0; i--) {
			const layer = unwrapIfSignal(layers[i])
			const computedLayer = this.computeLayer(layer)
			if (prop in computedLayer) {
				return computedLayer[prop]
			}
		}
		return undefined
	}

	reset() {
		this.layers = []
		this.style = {}
		this.onDestroy.forEach(func => func())
	}
}

