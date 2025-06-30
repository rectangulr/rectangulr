import { Component, ElementRef, Signal, ViewChild, computed, signal } from '@angular/core'
import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing'
import { setupTest } from '../../../tests/utils'
import { TermElement, TermScreen, TermText } from '..'
import { StyleHandler, StyleValue, diff, ifEq } from './StyleHandler'
import { H } from '../../../components/1-basics/h'
import { V } from '../../../components/1-basics/v'
import { Style } from '../../../components/1-basics/Style.directive'
import { Grow } from '../../../components/1-basics/grow.directive'
import { TermContainer } from '../dom/TermContainer'

function setup() {
	let screen: TermScreen
	let parent: TermElement
	let textNode: TermText

	TestBed.runInInjectionContext(() => {
		screen = new TermScreen()
		parent = new TermContainer()
		screen.appendChild(parent)

		textNode = new TermText()
		parent.appendChild(textNode)
	})
	screen.updateDirtyNodes()
	return { screen, parent, textNode }
}


describe('Style - ', () => {

	it('adds a layer', () => {
		let { screen, parent } = setup()
		expect(parent.style.get('width')).toEqual('auto')

		parent.style.add({ width: 3 })
		screen.updateDirtyNodes()
		expect(parent.style.get('width')).toEqual(3)
	})

	it('multiple layers combine, latest added wins', () => {
		let { screen, parent } = setup()
		expect(parent.style.get('width')).toEqual('auto')

		parent.style.add({ width: 3 })
		parent.style.add({ width: 4 })
		screen.updateDirtyNodes()
		expect(parent.style.get('width')).toEqual(4)
	})

	describe('childLayers', () => {

		it('should apply `childLayers` to the children', () => {
			let { screen, parent, textNode } = setup()
			expect(textNode.style.get('width')).toEqual('auto')

			parent.style.addChildren({ width: 3 })
			screen.updateDirtyNodes()
			expect(textNode.style.get('width')).toEqual(3)
		})

		it('childLayers can be overriden by child layer', () => {
			let { screen, parent, textNode } = setup()
			expect(textNode.style.get('width')).toEqual('auto')

			parent.style.addChildren({ width: 3 })
			textNode.style.add({ width: 4 })
			screen.updateDirtyNodes()
			expect(textNode.style.get('width')).toEqual(4)
		})

		it('parent childLayers can be overriden after children', () => {
			let { screen, parent, textNode } = setup()

			screen.updateDirtyNodes()
			expect(textNode.style.get('width')).toEqual('auto')

			parent.style.addChildren({ width: 3 })
			screen.updateDirtyNodes()
			expect(textNode.style.get('width')).toEqual(3)
		})

	})

	it('adds a func layer', () => {
		let { screen, parent } = setup()
		expect(parent.style.get('flexGrow')).toEqual(0)

		parent.style.add({ vgrow: true })
		screen.updateDirtyNodes()
		expect(parent.style.get('flexGrow')).toEqual(1)
	})

	it('adds a custom func layer', () => {
		let { screen, parent } = setup()
		expect(parent.style.get('width')).toEqual('auto')

		const widthStyle = (style: StyleHandler) => {
			return { width: 3 }
		}
		parent.style.add(widthStyle)
		screen.updateDirtyNodes()
		expect(parent.style.get('width')).toEqual(3)
	})

	it(`a child inherits the parent's color by default`, () => {
		let { screen, parent, textNode } = setup()
		parent.style.add({ color: 'red' })
		screen.updateDirtyNodes()

		expect(parent.style.get('color')).toEqual('red')
		expect(textNode.style.get('color')).toEqual('red')
	})

	it(`a child inherits a style if it is marked as 'inherit'`, () => {
		let { screen, parent, textNode } = setup()
		parent.style.add({ width: 3 })
		textNode.style.add({ width: 'inherit' })
		screen.updateDirtyNodes()

		expect(parent.style.get('width')).toEqual(3)
		expect(textNode.style.get('width')).toEqual(3)
	})


	it('signal layer', () => {
		let { screen, parent } = setup()
		expect(parent.style.get('width')).toEqual('auto')

		const signalStyle = signal({ width: 3 })

		parent.style.add(signalStyle)
		screen.updateDirtyNodes()
		expect(parent.style.get('width')).toEqual(3)
	})

	it('computed signal layer', fakeAsync(() => {
		let { screen, parent } = setup()
		expect(parent.style.get('width')).toEqual('auto')

		const width = signal({ width: 3 })
		const signalStyle = computed(() => {
			return width()
		})

		parent.style.add(signalStyle)
		screen.updateDirtyNodes()
		expect(parent.style.get('width')).toEqual(3)

		width.set({ width: 4 })
		tick()
		screen.updateDirtyNodes()
		expect(parent.style.get('width')).toEqual(4)
	}))

	it('component with computed signal layer', fakeAsync(() => {
		@Component({
			imports: [H, Style],
			template: `
				<h #parent [s]="ifEq(value, true, {width: 3})"></h>
			`
		})
		class Test {
			@ViewChild('parent') parent: ElementRef<TermElement>
			ifEq = ifEq
			value = signal(true)
		}

		const { fixture, component, shortcuts } = setupTest(Test)

		const parent = component.parent.nativeElement
		parent.rootNode.updateDirtyNodes()
		expect(parent.style.get('width')).toEqual(3)

		component.value.set(false)
		tick()
		parent.rootNode.updateDirtyNodes()
		expect(parent.style.get('width')).toEqual('auto')

		component.value.set(true)
		tick()
		parent.rootNode.updateDirtyNodes()
		expect(parent.style.get('width')).toEqual(3)

		flush()
	}))

	it('component with inherited computed signal style', fakeAsync(() => {
		@Component({
			imports: [H, Style],
			template: `
				<h #parent [s]="ifEq(value, true, {color: 'red'})">
					<h #child></h>
				</h>
			`
		})
		class Test {
			@ViewChild('parent') parent: ElementRef<TermElement>
			@ViewChild('child') child: ElementRef<TermElement>
			value = signal(false)
			ifEq = ifEq
		}

		const { fixture, component, shortcuts } = setupTest(Test)

		const parent = component.parent.nativeElement
		parent.rootNode.updateDirtyNodes()
		expect(parent.style.get('color')).toEqual(null)

		component.value.set(true)
		tick()
		parent.rootNode.updateDirtyNodes()
		expect(parent.style.get('color')).toEqual('red')

		component.value.set(false)
		tick()
		parent.rootNode.updateDirtyNodes()
		expect(parent.style.get('color')).toEqual(null)

		flush()
	}))

	it('text wrap should apply to inner text', () => {
		let { screen, parent, textNode } = setup()
		parent.style.add({ wrap: 'wrap' })
		textNode.textContent = 'very long text very long text very long text very long text very long text very long text'

		screen.updateDirtyNodes()
		expect(parent.style.get('wrap')).toEqual('wrap')
		expect(parent.childNodes[0].style.get('wrap')).toEqual('wrap')
	})

	it('stored depth info', () => {
		let { screen, parent, textNode } = setup()

		expect(screen.depth).toEqual(0)
		expect(parent.depth).toEqual(1)
		expect(textNode.depth).toEqual(2)
	})

})

describe('style diffing - ', () => {

	it('diff', () => {
		const res = {}
		diff({ modified: 1, removed: 0, same: 4 }, { same: 4, modified: 2, added: 3 }, res)
		expect(res).toEqual({ modified: 2, removed: undefined, added: 3 })
	})

})


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

export function unwrapIfFunction(value: any) {
	if (typeof value == 'function') {
		return value()
	} else {
		return value
	}
}
