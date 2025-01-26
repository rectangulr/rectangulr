import { Component, ElementRef, signal, viewChild } from "@angular/core"
import { TestBed } from "@angular/core/testing"
import fs from 'fs'
import { GrowDirective } from '../components/1-basics/grow.directive'
import { H } from '../components/1-basics/h'
import { StyleDirective } from "../components/1-basics/style"
import { V } from '../components/1-basics/v'
import { VGrowDirective } from "../components/1-basics/vgrow.directive"
import { ScrollDirective } from "../components/2-common/scroll.directive"
import { renderToString } from "./utils"
import { bootstrapApplication } from "../angular-terminal/platform"
import { TERMINAL } from "../angular-terminal/terminals/terminal"
import { ProcessTerminal } from "../angular-terminal/terminals/processTerminal"

it('TermText2 - should resize when the content changes', () => {
	@Component({
    template: '<h>{{text()}}</h>',
    imports: [H]
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
	expect(component.h().nativeElement.yogaNode.getComputedHeight()).toEqual(6)
})

it('TermText2 - should resize when the content changes (in a flexbox)', () => {
	@Component({
    template: `
			<v grow [s]="{maxHeight: 5}">
				<h>{{text()}}</h>
				<h [s]="{vgrow: true}">{{text()}}</h>
			</v>
		`,
    imports: [H, V, StyleDirective]
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
    imports: [H, V, StyleDirective, ScrollDirective, GrowDirective, VGrowDirective]
})
	class TestComponent {
		text = signal("bbbb\nbbbb\nbbbb\nbbbb\nbbbb\n")
		h = viewChild(H, { read: ElementRef })
		scroll = viewChild(ScrollDirective, { read: ElementRef })
	}

	const fixture = TestBed.createComponent(TestComponent)
	const component = fixture.componentInstance

	fixture.detectChanges()
	expect(component.scroll().nativeElement.yogaNode.getComputedHeight()).toEqual(8)
	expect(component.h().nativeElement.yogaNode.getComputedHeight()).toEqual(6)
})

it('snapshot', () => {
	@Component({
    template: `
			<h>aaaa</h>
			<h>bbbb</h>
		`,
    imports: [H, V, StyleDirective, ScrollDirective, GrowDirective, VGrowDirective]
})
	class TestComponent { }

	// globalThis['RECTANGULR_TARGET'] = 'node'
	// bootstrapApplication(TestComponent, {
	// 	providers: [
	// 		{ provide: TERMINAL, useFactory: () => new ProcessTerminal(process) }
	// 	]
	// })
	expectSnapshot('snapshot', TestComponent)
})

function expectSnapshot(name, comp) {
	let loaded = ''
	try {
		loaded = fs.readFileSync(`./src/tests/snapshots/${name}.txt`).toString()
	} catch (error) {
	}
	const buffer = renderToString(comp)
	if (loaded != buffer) {
		if (process.env['UPDATE_SNAPSHOTS']) {
			console.log('Updating snapshot', name)
			fs.writeFileSync(`./src/tests/snapshots/${name}.txt`, buffer)
		} else {
			fs.writeFileSync(`./src/tests/error-snapshots/${name}.txt`, buffer)
		}
	}
}
