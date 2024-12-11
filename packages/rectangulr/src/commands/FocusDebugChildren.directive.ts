import { Directive } from "@angular/core"
import { logFocus } from "./symbols"

@Directive({
	standalone: true,
	selector: '[focusDebugChildren]',
	providers: [
		{ provide: logFocus, useValue: true }
	]
})
export class FocusDebugChildrenDirective {
}
