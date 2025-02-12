import { Component, ElementRef, inject } from "@angular/core"
import { Element, H, HGrow, Scroll, V, bootstrapApplication } from "@rectangulr/rectangulr"
import { Grow } from "../components/1-basics/grow.directive"
import { Style } from "../components/1-basics/style"
import { VGrow } from "../components/1-basics/vgrow.directive"


@Component({
	template: `
		<h hgrow [s]="S.title">header</h>
		<v scroll [s]="{backgroundColor: 'lightgrey', color: '#2b2b2b'}">
			<h>aaaa</h>
			<h>{{text}}</h>
		</v>
		<h [s]="{ vgrow: true }"/>
		<h hgrow [s]="S.title">footer</h>
	`,
	imports: [H, V, Style, Scroll, Grow, VGrow, HGrow]
})
class TestComponent {
	text = Array.from({ length: 30 }, (_, i) => i + 1).join('\n')
	constructor() {
		const ref = inject(ElementRef).nativeElement as Element
		globalThis['ref'] = ref
	}

	S = {
		title: { backgroundColor: 'grey' },
	}
}

bootstrapApplication(TestComponent)
	.catch(e => console.error(e))
