import '@angular/compiler'
import { Component } from '@angular/core'
import { bootstrapApplication } from '@rectangulr/rectangulr'

@Component({
	template: `Main!`,
})
export class Main { }

bootstrapApplication(Main)
	.catch((err) => console.error(err))
