import { Component, ElementRef, signal, viewChild } from "@angular/core"
import { TestBed } from "@angular/core/testing"
import { bootstrapApplication } from "../angular-terminal/platform"
import { Grow } from '../components/1-basics/grow.directive'
import { H } from '../components/1-basics/h'
import { Style } from "../components/1-basics/Style.directive"
import { V } from '../components/1-basics/v'
import { VGrow } from "../components/1-basics/vgrow.directive"
import { Scroll } from "../components/2-common/scroll.directive"

@Component({
	template: '<h [s]="{flexShrink: 1}">{{text()}}</h>',
	standalone: true,
	imports: [H, Style]
})
class TestComponent {
	text = signal('aaa')
	h = viewChild(H, { read: ElementRef })
}

it('TermText2 - should resize when the content changes', () => {
	const fixture = TestBed.createComponent(TestComponent)
	const component = fixture.componentInstance

	fixture.detectChanges()
	expect(component.h().nativeElement.yogaNode.getComputedHeight()).toEqual(1)

	component.text.set("bbbb\nbbbb\nbbbb\nbbbb\nbbbb\n")
	fixture.detectChanges()
	expect(component.h().nativeElement.yogaNode.getComputedHeight()).toEqual(6)
})

it('TermText2 - should resize when the content changes (in a flexbox)', () => {
	@Component({
		template: `
			<v [s]="{maxHeight: 5}">
				<h>{{text()}}</h>
				<h [s]="{vgrow: true}">{{text()}}</h>
			</v>
		`,
		imports: [H, V, Style]
	})
	class TestComponent {
		text = signal('aaa')
		h = viewChild(H, { read: ElementRef })
	}

	const fixture = TestBed.createComponent(TestComponent)
	const component = fixture.componentInstance

	fixture.detectChanges()
	expect(component.h().nativeElement.yogaNode.getComputedHeight()).toEqual(1)

	component.text.set("bbbb\nbbbb\nbbbb\nbbbb\nbbbb\n")
	fixture.detectChanges()
	expect(component.h().nativeElement.yogaNode.getComputedHeight()).toEqual(3)
})

it('TermText2 - scroll', () => {
	@Component({
		template: `
			<v [s]="{maxHeight: 8}">
				<v scroll>
					<h [s]="{flexShrink: 0}">{{text()}}</h>
					<h [s]="{flexShrink: 0}">{{text()}}</h>
				</v>
			</v>
		`,
		imports: [H, V, Style, Scroll, Grow, VGrow]
	})
	class TestComponent {
		text = signal("bbbb\nbbbb\nbbbb\nbbbb\nbbbb\n")
		h = viewChild(H, { read: ElementRef })
		scroll = viewChild(Scroll, { read: ElementRef })
	}

	const fixture = TestBed.createComponent(TestComponent)
	const component = fixture.componentInstance

	fixture.detectChanges()
	expect(component.scroll().nativeElement.yogaNode.getComputedHeight()).toEqual(8)
	expect(component.h().nativeElement.yogaNode.getComputedHeight()).toEqual(6)
})

xit('text too big for screen / container', () => {
	@Component({
		template: `
			<h>bbbb</h>
			<!-- <h>{{text}}</h> -->
		`,
		imports: [H, V, Style, Scroll, Grow]
	})
	class TestComponent {
		text = 'aaaa\n'.repeat(100)
		constructor() {
			debugger
		}
	}

	// expectSnapshot('snapshot', TestComponent)
	bootstrapApplication(TestComponent)
		.catch(e => console.error(e))
})
