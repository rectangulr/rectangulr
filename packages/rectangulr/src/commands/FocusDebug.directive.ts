import { Directive } from "@angular/core"
import { ShortcutService } from "./shortcut.service"


@Directive({
	standalone: true,
	selector: '[focusDebug]',
})
export class FocusDebugDirective {
	constructor(public shortcutService: ShortcutService) {
		this.shortcutService.debugDenied = true
		this.shortcutService.logEnabled = true
	}
}
