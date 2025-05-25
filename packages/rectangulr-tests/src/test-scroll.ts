import { Component, inject } from "@angular/core"
import { bootstrapApplication, DomLog, H, HGrow, LogPointService, Scroll, Style, TermScreen, V, VGrow } from "@rectangulr/rectangulr"


@Component({
	template: `
		<v domLog scroll [s]="{backgroundColor: 'lightgrey', color: '#2b2b2b', height: 10}">
			<h>{{text}}</h>
		</v>
	`,
	imports: [H, V, Style, Scroll, VGrow, HGrow, DomLog]
})
class TestComponent {
	text = Array.from({ length: 20 }, (_, i) => i + 1).join('\n')
	screen = inject(TermScreen)
	lp = inject(LogPointService)

	constructor() {
		const input = {
			type: 'mouse',
			name: 'wheel',
			x: 0,
			y: 0,
			start: true,
			end: false,
			d: 1,
		} as const

		this.lp.bpSelectorString.set('Render')
		setTimeout(() => {
			debugger
			this.screen.handleInput(input)
		}, 20)
	}
}

// @ts-ignore
globalThis.document ??= {}
// @ts-ignore
process.env.BREAKPOINTS = 'Render'
bootstrapApplication(TestComponent)
	.catch(e => console.error(e))
