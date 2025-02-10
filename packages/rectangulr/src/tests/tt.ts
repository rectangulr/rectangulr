import { Component, ElementRef, inject } from "@angular/core"
import { Element, GrowDirective, H, HGrowDirective, ScrollDirective, StyleDirective, V, VGrowDirective, addStyle, bootstrapApplication } from "@rectangulr/rectangulr"


@Component({
	template: `
		<h hgrow [s]="S.title">header</h>
		<v scroll [s]="{backgroundColor: 'lightgrey', flexShrink: 1}">
			<h>aaaa</h>
			<h>{{text}}</h>
		</v>
		<h [s]="{ vgrow: true }"/>
		<h [s]="S.title">footer</h>
	`,
	imports: [H, V, StyleDirective, ScrollDirective, GrowDirective, VGrowDirective, HGrowDirective]
})
class TestComponent {
	text = Array.from({ length: 30 }, (_, i) => i + 1).join('\n')
	constructor() {
		addStyle({ backgroundColor: 'green' })

		const ref = inject(ElementRef).nativeElement as Element
		globalThis['ref'] = ref
	}

	S = {
		title: { backgroundColor: 'grey', width: '100%' },
	}
}

bootstrapApplication(TestComponent)
	.catch(e => console.error(e))

function assert(condition: any, msg?: string): asserts condition {
	if (!condition) throw new Error(msg)
}
