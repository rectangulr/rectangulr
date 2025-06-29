import { Component, ElementRef, inject } from "@angular/core"
import { H, HGrow, Scroll, Style, TermElement, V, VGrow, bootstrapApplication } from "@rectangulr/rectangulr"


@Component({
	template: `
		<v [s]="{backgroundColor: 'lightgrey', color: '#2b2b2b', height: 10}">
			<h>aaaa</h>
			<h>{{text}}</h>
		</v>
	`,
	imports: [H, V, Style]
})
class TestComponent {
	text = Array.from({ length: 20 }, (_, i) => i + 1).join('\n')
	constructor() {
		const ref = inject(ElementRef).nativeElement as TermElement
		// globalThis['ref'] = ref
	}

	S = {
		title: { backgroundColor: 'grey', height: 3 },
	}
}

bootstrapApplication(TestComponent)
	.catch(e => console.error(e))
