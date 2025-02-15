import { Component } from "@angular/core"
import { StyleValue, H, HGrow, Scroll, Style, V, VGrow, bootstrapApplication } from "@rectangulr/rectangulr"

type Rg = { s: StyleValue }

@Component({
	template: `
		<v [s]="s">
			<h>aaaa</h>
			<h>{{text}}</h>
		</v>
	`,
	imports: [H, V, Style, Scroll, VGrow, HGrow]
})
class TestComponent implements Rg {
	text = Array.from({ length: 22 }, (_, i) => i + 1).join('\n')
	s = { backgroundColor: 'green', height: 20, marginTop: 2, overflow: 'hidden' } as const
}

bootstrapApplication(TestComponent)
	.catch(e => console.error(e))
