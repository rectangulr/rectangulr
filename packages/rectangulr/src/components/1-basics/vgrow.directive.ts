import { Directive, inject, ElementRef } from '@angular/core'
import { TermElement as Element } from '../../angular-terminal/dom-terminal'

/**
 * Grow vertically
 * <v vgrow></v>
 */

@Directive({
	standalone: true,
	selector: '[vgrow]',
})
export class VGrow {
	elementRef = inject<ElementRef<Element>>(ElementRef);

	ngOnInit() {
		this.elementRef.nativeElement.style.add({ vgrow: true })
	}
}
