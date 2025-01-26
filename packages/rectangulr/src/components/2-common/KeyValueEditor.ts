import { Component, inject, input, model } from "@angular/core"
import { FormGroup, ReactiveFormsModule } from "@angular/forms"
import { StyleDirective } from "../1-basics/style"
import { TextInput } from "../1-basics/text-input"
import { blackOnWhite } from "./styles"
import { ShortcutService } from "../../commands/shortcut.service"


@Component({
    selector: 'keyvalue-editor',
    template: `
    <v [formGroup]="formGroup" [s]="{ flexDirection: 'row' }">
      <v [s]="{ width: keyWidth() + 1 }" [s]="[blackOnWhite]">{{ keyValue().key }}</v>
      <text-input [formControlName]="keyValue().key" [text]="keyValue().value"/>
    </v>
    `,
    imports: [TextInput, ReactiveFormsModule, StyleDirective]
})
export class KeyValueEditor {
	readonly keyValue = input<{
		key: string
		value: any
	} | null>(null);

	readonly keyWidth = model(0);

	formGroup = inject(FormGroup)
	shortcutService = inject(ShortcutService)

	ngOnInit() {
		if (!this.keyWidth()) {
			this.keyWidth.set(this.keyValue().key.length)
		}
	}

	blackOnWhite = blackOnWhite;

	ngOnDestroy() {
		this.shortcutService.unfocus()
	}
}
