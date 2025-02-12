import { Directive, inject, ElementRef } from '@angular/core'
import { TermElement as Element } from '../../angular-terminal/dom-terminal/sources/core/dom/Element'

/**
 * <v grow></v>
 */

@Directive({
	standalone: true,
	selector: '[grow]',
})
export class Grow {
	elementRef = inject<ElementRef<Element>>(ElementRef);

	ngOnInit() {
		this.elementRef.nativeElement.style.add({ vgrow: true, hgrow: true })
	}
}
