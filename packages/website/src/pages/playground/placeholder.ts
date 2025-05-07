import '@angular/compiler'
import { Component, signal } from '@angular/core'
import { bootstrapApplication, provideXtermJs } from '@rectangulr/rectangulr'

RECTANGULR_TARGET = 'web'

@Component({
	template: `Hello from {{name()}}!`,
})
class Main {
	name = signal('Angular')
}

bootstrapApplication(Main, {
	providers: [
		provideXtermJs(globalThis['xterm'])
	]
}).catch((err) => console.error(err))
