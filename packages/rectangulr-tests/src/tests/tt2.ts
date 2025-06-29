import { Component } from "@angular/core"
import { H, Style, V, bootstrapApplication } from "@rectangulr/rectangulr"

@Component({
	template: `
		<v [s]="{ backgroundColor: 'green', height: 20 }">
			<h>aaaa</h>
			<h>{{text}}</h>
		</v>
	`,
	imports: [H, V, Style]
})
class TestComponent {
	text = Array.from({ length: 22 }, (_, i) => i + 1).join('\n')
}

bootstrapApplication(TestComponent)
	.catch(e => console.error(e))
