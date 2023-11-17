import { ElementRef, Injector, Signal, computed, effect, inject, isSignal } from "@angular/core"
import { unwrapIfFunction, unwrapIfSignal } from "../../../../../utils/utils"
import { computedStyles, isComputedStyle, styles } from "../style/styleProperties"
import { parsePropertyValue } from "../style/tools/parsePropertyValue"
import { Element } from './Element'

type StyleKey = keyof StyleValue
export type Layer = StaticLayer | SignalLayer
type StaticLayer = StyleValue
type SignalLayer = Signal<StyleValue>

export class StyleHandler {

	layers: Layer[] = []
	// style: StyleValue = {}
	/** TODO: only initialize if signal layer added */
	oldValues = new WeakMap()
	onDestroy: (() => void)[] = []

	constructor(public element: Element, public injector: Injector) {
		this.retriggerKeys(styles)
	}

	add(layer: Layer) {
		this.layers.push(layer)
		this.retriggerKeys(unwrapIfSignal(layer))

		if (isSignal(layer)) {
			const e = effect(() => {
				this.retriggerKeys(layer(), this.oldValues.get(layer))
				this.oldValues.set(layer, layer())
			}, { injector: this.injector, manualCleanup: true })
			this.onDestroy.push(() => e.destroy())
		}
	}

	retriggerKeys(layer: StaticLayer, oldLayer?: StaticLayer) {
		const computedLayer = this.computeLayer(layer)

		let keysChangedSet = new Set(Object.keys(computedLayer))
		if (oldLayer) {
			Object.keys(oldLayer).forEach(key => {
				keysChangedSet.add(key)
			})
		}

		const keysChanged = [...keysChangedSet.values()]
		for (const key of orderKeys(keysChanged)) {
			const propInfo = styles[key]
			const rawValue = this.get(key as any)
			// this.style[key as string] = rawValue
			// if (this.style[key] !== rawValue) {
			propInfo.triggers?.forEach(trigger => {
				const value = parsePropertyValue(key, rawValue)
				trigger(this.element, value, value)
			})
			// }
		}
	}

	computeLayer(layer: StaticLayer): StyleValue {
		layer = unwrapIfSignal(layer)

		let computedLayer = {}
		for (const [key, value] of Object.entries(layer)) {
			if (isComputedStyle(key)) {
				const computeFunction = computedStyles[key].func
				const computedStyle = computeFunction(this, value)
				Object.assign(computedLayer, computedStyle)
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

	get<K extends StyleKey>(propName: K): StyleValue[K] {
		const prop = styles[propName]

		let value = this.getFromLayers(propName, this.layers)

		if (value === undefined && prop.initial !== undefined) {
			value = prop.initial
		}

		if (value === 'inherit') {
			if (this.element.parentNode?.style) {
				value = this.element.parentNode.style.get(propName)
			} else {
				value = styles[propName].default
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
		// this.style = {}
		this.onDestroy.forEach(func => func())
		this.retriggerKeys(styles)
	}
}

function orderKeys(keys: string[]) {
	return keys.sort((keyA, keyB) => {
		return indexOfStyle(keyA) - indexOfStyle(keyB)
	})
}

const allStyleKeys = [...Object.keys(styles), ...Object.keys(computedStyles)]

function indexOfStyle(styleKey: string) {
	return allStyleKeys.indexOf(styleKey)
}

export function cond(condition: Signal<any> | any | ((...args) => boolean), style: StyleValue) {
	return computed(() => {
		if (unwrapIfFunction(condition)) {
			return style
		} else {
			return {}
		}
	})
}

export function eq(value1, value2) {
	return () => unwrapIfFunction(value1) == unwrapIfFunction(value2)
}

export function neq(value1, value2) {
	return () => unwrapIfFunction(value1) != unwrapIfFunction(value2)
}

export function addStyle(layer: Layer) {
	const elementRef = inject(ElementRef)
	elementRef.nativeElement.style.add(layer)
}

export interface StyleValue {
	display?: 'flex' | 'none'
	alignContent?: 'flexStart' | 'flexEnd' | 'center' | 'spaceBetween' | 'spaceAround' | 'stretch'
	alignItems?: 'flexStart' | 'flexEnd' | 'center' | 'baseline' | 'stretch'
	alignSelf?: 'auto' | 'flexStart' | 'flexEnd' | 'center' | 'baseline' | 'stretch'
	flexDirection?: 'row' | 'column' | 'rowReverse' | 'columnReverse'
	position?: 'relative' | 'sticky' | 'absolute' | 'fixed'
	left?: string | number
	right?: string | number
	top?: string | number
	bottom?: string | number
	zIndex?: number
	margin?: string | number | (string | number)[]
	marginLeft?: string | number
	marginRight?: string | number
	marginTop?: string | number
	marginBottom?: string | number
	// flex?: (string)[],
	flexGrow?: number
	flexShrink?: number
	flexBasis?: number
	width?: string | number
	height?: number | string
	minWidth?: string | number
	minHeight?: string | number
	maxWidth?: string | number
	maxHeight?: string | number
	overflow?: 'visible' | 'hidden'
	border?: 'simple' | 'modern' | 'strong' | 'double' | 'block' | 'rounded'
	borderLeftCharacter?: string | null
	borderRightCharacter?: string | null
	borderTopCharacter?: string | null
	borderBottomCharacter?: string | null
	borderTopLeftCharacter?: string | null
	borderTopRightCharacter?: string | null
	borderBottomLeftCharacter?: string | null
	borderBottomRightCharacter?: string | null
	padding?: (string | number)[]
	paddingLeft?: string | number
	paddingRight?: string | number
	paddingTop?: string | number
	paddingBottom?: string | number
	fontWeight?: 'normal' | 'bold' | 'fainted'
	textAlign?: 'left' | 'center' | 'right' | 'justify'
	textDecoration?: 'underline' | null
	// whiteSpace?: ,
	// overflowWrap?: ,
	color?: Color
	borderColor?: Color
	// background?,
	backgroundClip?: 'borderBox' | 'paddingBox' | 'contentBox'
	backgroundColor?: Color
	backgroundCharacter?: string
	// focusEvents?: boolean
	pointerEvents?: boolean

	scroll?: 'x' | 'y' | 'xy' | null
	hgrow?: boolean
	vgrow?: boolean
	justifyContent?: 'flexStart' | 'flexEnd' | 'center' | 'baseline' | 'stretch'
	wrap?: 'wrap' | null
}

export type Color = string | null
