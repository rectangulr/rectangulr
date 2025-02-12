import { Directive, ElementRef, inject } from '@angular/core'
import { Element, TermText2 } from '../angular-terminal/dom-terminal/index'
import { traverse } from '../angular-terminal/dom-terminal/sources/core/dom/Node'
import { LogPointService } from './LogPointService'

@Directive({
	selector: '[domLog]',
	standalone: true,
})
export class DomLog {
	protected element = inject(ElementRef<Element>).nativeElement
	protected logPointService = inject(LogPointService)

	ngOnInit() {
		traverse(this.element, node => {
			if (node.nodeName == 'TermText2') {
				(node as TermText2).lp = this.logPointService
			}
		})
	}
}