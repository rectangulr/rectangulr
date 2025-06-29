import { Component, ElementRef, viewChild } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Grow, H, HGrow, Scroll, Style, TermElement, V, VGrow } from '@rectangulr/rectangulr'
import { expectSnapshotComponentText } from '@rectangulr/rectangulr/testing'

it('should hgrow', () => {
	@Component({
		template: `
			<h #parent [s]="{ width: 10 }">
				<h #a>a</h>
				<h #b hgrow>b</h>
				<h #c>c</h>
			</h>
		`,
		imports: [H, V, Style, Scroll, Grow, VGrow, HGrow]
	})
	class TestComponent {
		parent = viewChild.required('parent', { read: ElementRef<TermElement> })
	}

	const fixture = TestBed.createComponent(TestComponent)
	fixture.detectChanges()

	const parent = fixture.componentInstance.parent().nativeElement
	parent.updateDirtyNodes()
	expect(parent.childNodes.length).toEqual(3)
	expect(parent.childNodes[0].yogaNode.getComputedWidth()).toEqual(1)
	expect(parent.childNodes[1].yogaNode.getComputedWidth()).toEqual(8)
	expect(parent.childNodes[2].yogaNode.getComputedWidth()).toEqual(1)
	// expectSnapshotComponentText('hgrow', TestComponent)
})

it('bug first line doesnt show', () => {
	@Component({
		template: `
			<h>Title1</h>
			<h>Title2</h>
			<h>word</h>
			<h>word2</h>
		`,
		imports: [H]
	})
	class Test { }

	expectSnapshotComponentText('bug1', Test)
})
