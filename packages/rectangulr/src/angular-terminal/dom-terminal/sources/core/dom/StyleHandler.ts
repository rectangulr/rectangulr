import { ElementRef, Injector, Signal, computed, effect, inject, isSignal } from "@angular/core"
import * as _ from '@s-libs/micro-dash'
import { AnyObject, assert, unwrapIfFunction } from "../../../../../utils/utils"
import { computedStyles, isComputedStyle, styles } from "../style/styleProperties"
import { parsePropertyValue } from "../style/tools/parsePropertyValue"
import { TermElement } from './Element'

type StyleKey = keyof StyleValue
export type Layer = SimpleLayer | ((StyleHandler) => StyleValue) | SignalLayer
type SimpleLayer = StyleValue
type SignalLayer = Signal<StyleValue>

export class StyleHandler {

	initialized = false

	layers: Layer[] = []
	dirty = false
	wasQueued = false

	self: StyleValue = {}
	inherited: StyleValue = {}

	previousSignalValue = new WeakMap()
	onDispose: (() => void)[] = []

	constructor(public element: TermElement, public injector: Injector) {
		this.init()
	}

	add(layer: Layer) {
		{
			const maybeComputeds = convertComputedKeysToFunctions(layer)
			if (maybeComputeds.length > 1) {
				maybeComputeds.forEach(layer => this.add(layer))
				return
			}
		} 

		this.layers.push(layer)
		this.dirtyLayer()

		if (isSignal(layer)) {
			const e = effect(() => {
				layer()
				this.dirtyLayer()
			}, { injector: this.injector, manualCleanup: true })
			this.onDispose.push(() => e.destroy())
		}

	}

	dirtyLayer() {
		this.dirty = true
		this.queueDirty()
	}

	queueDirty() {
		if (this.element.rootNode) {
			this.wasQueued = this.element.rootNode.queueDirtyStyle(this.element)
		}
	}

	// // Make sure no parent has changes
	// if (checks) {
	// 	for (let node = this.element.parentNode; node; node = node.parentNode) {
	// 		assert(Object.keys(node.style.dirty).length == 0)
	// 	}
	// }

	// assert(!this.dirty)


	getSelf<K extends StyleKey>(key: K, checks = true): StyleValue[K] {

		// Check layers first
		if (key in this.self) {
			return this.self[key]
		}

		// Then check initial values
		const styleInfo = styles[key]
		assert(styleInfo)

		const value = styleInfo.initial
		assert(value !== undefined)
		return value
	}

	get<K extends StyleKey>(key: K): StyleValue[K] {
		const selfValue = this.getSelf(key)
		let value = selfValue
		if (selfValue == 'inherit') {
			if (this.element.parentNode) {
				value = getParentKey(this.element, key)
				assert(value !== undefined)
			} else {
				value = styles[key].default
				assert(value !== undefined)
			}
		}
		assert(value !== 'inherit')
		return value
	}

	init() {
		for (const [key, styleInfo] of Object.entries(styles)) {
			const parentGet = (key) => {
				return getParentKey(this.element, key)
			}

			inherit(key, styleInfo.initial, parentGet, this.inherited)
			runTriggers(this.element, key, this.get(key as any))
		}
		this.initialized = true
	}

	update(parentModified: StyleValue = {}) {
		const modified = {}
		let newSelf = this.self

		if (this.dirty) {
			newSelf = resolveStyle(this, this.layers)
			diff(this.self, newSelf, modified)
		}

		const parentGet = (key) => { return getParentKey(this.element, key) }

		for (let [key, modifiedValue] of Object.entries(modified)) {
			if (modifiedValue === undefined) {
				modifiedValue = styles[key].initial
				modified[key] = modifiedValue
			}
		}

		if (parentModified) {
			for (const [key, value] of Object.entries(parentModified)) {
				if (key in this.inherited) {
					this.inherited[key] = value
					assert(value !== undefined)
					assert(value !== 'inherit')
					modified[key] = value
				}
			}
		}

		for (const [key, value] of Object.entries(modified)) {
			// TODO: if value really changed
			const safeValue = inherit(key, value, parentGet, this.inherited)
			runTriggers(this.element, key, safeValue)
		}

		// total = inherit(self) + inherited

		this.dirty = false
		this.wasQueued = false
		this.self = newSelf

		for (const child of this.element.childNodes) {
			if (Object.keys(modified).some(key => key in child.style.inherited)) {
				child.style.update(modified)
			}
		}
	}

	reset() {
		this.layers = []
		this.dirty = false
		this.initialized = false
		this.self = {}
		this.previousSignalValue = new WeakMap()
		this.inherited = {}
	}

	dispose() {
		for (const func of this.onDispose) {
			func()
		}
	}
}

function assertNoInherit(obj) {
	for (const [key, value] of Object.entries(obj)) {
		assert(value !== 'inherit')
	}
}


function assertNoUndefined(obj) {
	for (const [key, value] of Object.entries(obj)) {
		assert(value !== undefined)
	}
}

function getParentKey(element: TermElement, key: StyleKey) {
	if (!element.parentNode) {
		const styleInfo = styles[key]
		assert(styleInfo)

		return styleInfo.default
	}

	return element.parentNode.style.get(key)
}

function inherit(key, selfValue, parentGet, inherited) {
	let value = selfValue
	if (selfValue == 'inherit') {
		value = parentGet(key)
		inherited[key] = value
		assert(value !== 'inherit')
	} else {
		if (key in inherited) {
			delete inherited[key]
		}
	}
	return value
}

function runTriggers(element: TermElement, key: string, value: any) {
	const propInfo = styles[key]
	assert(propInfo, `couldnt find style key: ${key}`)

	const parsedValue = parsePropertyValue(key, value)

	propInfo.triggers?.forEach(trigger => {
		trigger(element, parsedValue, parsedValue)
	})
}

function resolveStyle(style, layers) {
	const res = {}
	for (const layer of layers) {
		let layerValue = layer
		if (_.isFunction(layer)) {
			layerValue = layer(style)
			assert(typeof layerValue == 'object', `not a valid style: ${JSON.stringify(layerValue)}`)
		}
		for (const [key, value] of Object.entries(layerValue)) {
			res[key] = value
		}
	}
	return res
}


export function diff(a: { [key: string]: any }, b: { [key: string]: any }, res: AnyObject) {
	for (const [key, value] of Object.entries(b)) {
		if (key in a) {
			if (value !== a[key]) {
				res[key] = value
			}
		} else {
			res[key] = value
		}
	}
	for (const [key, value] of Object.entries(a)) {
		if (!(key in b)) {
			res[key] = undefined
		}
	}
}

export function cond(condition: Signal<any> | any | ((...args) => boolean), style: StyleValue) {
	return computed(() => {
		if (unwrapIfFunction(condition)) {
			return unwrapIfFunction(style)
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
	scrollF?: 'x' | 'y' | 'xy' | null
	hgrow?: boolean
	vgrow?: boolean
	justifyContent?: 'flexStart' | 'flexEnd' | 'center' | 'baseline' | 'stretch'
	wrap?: 'wrap' | null
}

export type Color = string | null


/**
 * Allows to have computed styles like { vgrow: true } as data
 * Will be removed once Angular allows passing a variable [vgrowFunction] in the template directly
 *
 * {
 * 	vgrow: true,
 * 	background: 'red'
 * }
 *
 * functions:  [vgrow,]
 * res: {background: 'red'}
 *
 * return [{background: 'red'}, vgrow]
**/
function convertComputedKeysToFunctions(layer: Layer): Layer[] {

	let normalKeys = {}
	let computeds = []
	Object.entries(layer).forEach(([key, value]) => {
		if (isComputedStyle(key)) {
			const func = computedStyles[key]
			assert(func)
			computeds.push((style) => func.func(style, value))
		} else {
			normalKeys[key] = layer[key]
		}
	})

	if (computeds.length > 0) {
		return [normalKeys, ...computeds]
	} else {
		return [layer]
	}
}
