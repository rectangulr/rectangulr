import { Directive, inject, ElementRef } from '@angular/core'
import { TermElement as Element } from '../../angular-terminal/dom-terminal/sources/core/dom/TermElement'

/**
 * Grow horizontally
 * @example <v hgrow></v>
 */

@Directive({
	standalone: true,
	selector: '[hgrow]',
})
export class HGrow {
	elementRef = inject<ElementRef<Element>>(ElementRef);

	ngOnInit() {
		this.elementRef.nativeElement.style.add({ hgrow: true })
	}
}
