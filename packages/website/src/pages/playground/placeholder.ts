import { Component, signal } from '@angular/core'
import { bootstrapApplication, H, List, provideXtermJs, Style } from '@rectangulr/rectangulr'

@Component({
	template: `
		<h>Hello from {{name()}}!</h>
		<h>Page links:</h>
		<list [items]="links()" [s]="{paddingLeft: 2}"></list>
	`,
	imports: [List, Style, H],
})
class Main {
	name = signal('rectangulr')
	links = signal(
		Array.from(document.querySelectorAll('a'))
			.map(a => a.textContent + ' - ' + a.href)
	)
}

bootstrapApplication(Main, {
	providers: [
		//@ts-ignore
		provideXtermJs(globalThis['xterm'])
	]
}).catch((err) => console.error(err))
