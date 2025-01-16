import { Directive, inject, ElementRef } from '@angular/core'
import { TermElement as Element } from '../../angular-terminal/dom-terminal/sources/core/dom/Element'

/**
 * Think of it as `div` for the terminal. The basic building block for templates.
 * It displays its children vertically.
 * @example
 * <v>Some text</v>
 */

@Directive({
	standalone: true,
	selector: 'v',
})
export class V {
	elementRef = inject<ElementRef<Element>>(ElementRef);

	ngOnInit() {
		this.elementRef.nativeElement.style.add({ flexDirection: 'column' })
	}
}
