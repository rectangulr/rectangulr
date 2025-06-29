import { Component } from '@angular/core'
import { AppShell, bootstrapApplication, provideView, provideXtermJs } from '@rectangulr/rectangulr'

@Component({
	template: `Tab 1`,
})
export class Tab1 { }

@Component({
	template: `Tab 2`,
})
export class Tab2 { }

export default function main(xterm: any) {
	bootstrapApplication(AppShell, {
		providers: [
			provideView({ name: 'Tab 1', component: Tab1 }),
			provideView({ name: 'Tab 2', component: Tab2 }),
			provideXtermJs(xterm),
		]
	})
}
