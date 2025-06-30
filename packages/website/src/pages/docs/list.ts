import { Component, signal } from '@angular/core'
import { List } from '@rectangulr/rectangulr'

@Component({
	template: `
		<list [items]="items()"/>
	`,
	imports: [List]
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
