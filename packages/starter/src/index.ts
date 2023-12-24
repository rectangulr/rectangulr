import { Component } from '@angular/core'
import { TermScreen, bootstrapApplication } from '@rectangulr/rectangulr'
import 'zone.js/node'

@Component({
	template: 'main',
	standalone: true,
})
class Main {
	constructor(public screen: TermScreen) {
		setTimeout(() => {
			screen.terminate()
		}, 20)
	}
}

bootstrapApplication(Main)
