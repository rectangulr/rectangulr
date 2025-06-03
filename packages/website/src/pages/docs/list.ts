import { Component, signal } from '@angular/core'
import { H, List } from '@rectangulr/rectangulr'

@Component({
	template: `
		<list [items]="items()"/>
	`,
	imports: [H, List]
})
export default class ListExample {
	items = signal([
		'first line',
		'second line',
		'third line',
		'fourth line',
		'fifth line',
	])
}
