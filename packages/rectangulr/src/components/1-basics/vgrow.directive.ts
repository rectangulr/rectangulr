import { Directive, inject, ElementRef } from '@angular/core'
import { TermElement as Element } from '../../angular-terminal/dom-terminal/sources/core/dom/Element'

/**
 * Grow vertically
 * <v vgrow></v>
 */

@Directive({
	standalone: true,
	selector: '[vgrow]',
})
export class VGrowDirective {
	elementRef = inject<ElementRef<Element>>(ElementRef);

	ngOnInit() {
		this.elementRef.nativeElement.style.add({ vgrow: true })
	}
}
