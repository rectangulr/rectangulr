import { Directive, Input, TemplateRef } from "@angular/core"
import { List } from "./list"


@Directive({
	selector: "[listItem]",
})
export class ListItem<T> {
	@Input() listItemType: ArrayLike<T>

	static ngTemplatextGuard<T>(
		directive: ListItem<T>,
		context: any
	): context is { listItemType: ArrayLike<T>; $implicit: T } {
		return true
	}
}
