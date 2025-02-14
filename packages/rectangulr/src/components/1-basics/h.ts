import { Directive, inject, ElementRef } from '@angular/core'
import { TermElement as Element } from '../../angular-terminal/dom-terminal/sources/core/dom/TermElement'

/**
 * Think of it as `div` for the terminal. The basic building block for templates.
 * It displays its children horizontally.
 *
 * @example
 * <h>Same thing</h>
 */
// This directive does nothing. It's just there for autocompletion from Angular.
// This is handled by the dom - terminal renderer.

@Directive({
	standalone: true,
	selector: 'h',
})
export class H {
	elementRef = inject<ElementRef<Element>>(ElementRef);

	ngOnInit() {
		this.elementRef.nativeElement.style.add({ flexDirection: 'row' })
	}
}
