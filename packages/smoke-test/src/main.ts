import '@angular/compiler'
import { Component, inject } from '@angular/core'
import { TermScreen, bootstrapApplication } from '@rectangulr/rectangulr'

@Component({
	template: 'main',
})
class Main {
	screen = inject(TermScreen)
	constructor() {
		setTimeout(() => {
			this.screen.exit()
		}, 20)
	}
}

bootstrapApplication(Main)
	.catch((err) => console.error(err))
