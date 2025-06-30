import { Component, ElementRef, inject, signal, viewChild } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectSnapshot, expectSnapshotComponentText } from '../../../../testing/src/expectSnapshot'
import { Grow } from '../../../components/1-basics/grow.directive'
import { H } from '../../../components/1-basics/h'
import { HGrow } from '../../../components/1-basics/hgrow.directive'
import { Style } from '../../../components/1-basics/Style.directive'
import { V } from '../../../components/1-basics/v'
import { VGrow } from '../../../components/1-basics/vgrow.directive'
import { Scroll } from "../../../components/2-common/scroll.directive"
import { DomLog } from "../../../logs/DomLog.directive"
import { Frame } from '../paint/Frame'
import { TermContainer } from './TermContainer'
import { TermElement } from './TermElement'
import { TermScreen } from './TermScreen'
import { TermText } from './TermText'

describe('TermScreen', () => {
	it('updates screen size', () => {
		let screen: TermScreen
		let el: TermContainer
		TestBed.runInInjectionContext(() => {
			screen = inject(TermScreen)
			el = new TermContainer()
			screen.appendChild(el)
		})
		screen.style.add({ width: 10, height: 10, flexShrink: 0 })
		screen.updateDirtyNodes()
		expect(screen.yogaNode.getWidth().value).toEqual(10)
		expect(screen.yogaNode.getComputedWidth()).toEqual(10)
		expect(screen.yogaNode.getComputedHeight()).toEqual(10)
	})

	it('render TermContainer', () => {
		let screen: TermScreen
		let el: TermContainer
		TestBed.runInInjectionContext(() => {
			screen = new TermScreen()
			el = new TermContainer()
			screen.appendChild(el)
		})

		// parent
		screen.size.set({ width: 10, height: 10 })
		screen.style.add({ width: 10, height: 10 })
		el.style.add({ vgrow: true, hgrow: true })

		screen.updateDirtyNodes()

		expect(screen.yogaNode.getComputedHeight()).toEqual(10)
		expect(screen.yogaNode.getComputedWidth()).toEqual(10)
		expect(el.yogaNode.getComputedHeight()).toEqual(10)
		expect(el.yogaNode.getComputedWidth()).toEqual(10)

		const frame = new Frame(screen.size())
		el.render('full', frame)
		const res = frame.renderToPlainText()
		expectSnapshot('dom3.render.TermContainer', res)
	})

	it('render TermText', () => {
		let screen: TermScreen
		let el: TermContainer
		let txt: TermText
		TestBed.runInInjectionContext(() => {
			screen = new TermScreen()
			el = new TermContainer()
			screen.appendChild(el)
			txt = new TermText()
			txt.textContent = 'Hello'
			el.appendChild(txt)
		})

		screen.size.set({ width: 10, height: 10 })
		screen.style.add({ width: 10, height: 10 })
		el.style.add({ vgrow: true, hgrow: true })

		screen.updateDirtyNodes()

		expect(screen.yogaNode.getComputedHeight()).toEqual(10)
		expect(screen.yogaNode.getComputedWidth()).toEqual(10)
		expect(el.yogaNode.getComputedHeight()).toEqual(10)
		expect(el.yogaNode.getComputedWidth()).toEqual(10)

		const frame = new Frame(screen.size())
		el.render('full', frame)
		const res = frame.renderToPlainText()
		expectSnapshot('dom3.render.TermText', res)
	})

	it('render TermText - component', () => {
		@Component({
			template: `
				<h [s]="{}">Hello this is a test to test this thing</h>
			`,
			imports: [Style]
		})
		class Test { }

		expectSnapshotComponentText('dom3.render.TermText.component', Test)
	})

	it('snapshot', () => {
		@Component({
			template: `
				<h domLog>aaaa</h>
				<h>bbbb</h>
			`,
			imports: [H, DomLog]
		})
		class TestComponent { }

		expectSnapshotComponentText('snapshot', TestComponent)
		// expectSnapshotComponentAnsi('snapshot.ansi', TestComponent)
	})


	it('snapshot - change text', () => {
		@Component({
			template: `
				<h domLog>{{text()}}</h>
				<h>cccc</h>
			`,
			imports: [H, DomLog]
		})
		class TestComponent {
			text = signal('aaaa')
		}


		const fixture = TestBed.createComponent(TestComponent)
		const el: TermElement = fixture.elementRef.nativeElement
		fixture.detectChanges()
		el.rootNode.updateDirtyNodes()
		el.rootNode.render('full', el.rootNode.frame)
		const res = el.rootNode.frame.renderToPlainText()
		expectSnapshot('snapshot.changeText.1', res)

		fixture.componentInstance.text.set('bbbb')
		fixture.detectChanges()
		el.rootNode.updateDirtyNodes()
		el.rootNode.render('full', el.rootNode.frame)
		const res2 = el.rootNode.frame.renderToPlainText()
		expectSnapshot('snapshot.changeText.2', res2)
	})

	it('should hgrow', () => {
		@Component({
			template: `
				<h [s]="{ width: 10 }">
					<h #a>a</h>
					<h #b hgrow>b</h>
					<h #c>c</h>
				</h>
			`,
			imports: [H, Style, HGrow]
		})
		class TestComponent {
			a = viewChild.required('a', { read: ElementRef })
			b = viewChild.required('b', { read: ElementRef })
			c = viewChild.required('c', { read: ElementRef })
		}

		const fixture = TestBed.createComponent(TestComponent)
		const comp = fixture.componentInstance
		const el: TermElement = fixture.elementRef.nativeElement
		fixture.detectChanges()

		el.rootNode.updateDirtyNodes()
		expect(comp.a().nativeElement.yogaNode.getComputedWidth()).toEqual(1)
		// expectSnapshotComponentText('hgrow', TestComponent)
	})

})
