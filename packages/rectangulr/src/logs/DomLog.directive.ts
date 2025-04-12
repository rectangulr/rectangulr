import { Directive, ElementRef, inject } from '@angular/core'
import { TermElement, TermText, } from '../angular-terminal/dom-terminal'
import { traverse } from '../angular-terminal/dom-terminal/dom/Node'
import { LogPointService } from './LogPointService'

@Directive({
	selector: '[domLog]',
	standalone: true,
})
export class DomLog {
	protected element: TermElement = inject(ElementRef).nativeElement
	protected logPointService = inject(LogPointService)

	ngOnInit() {
		traverse(this.element, node => {
			if (node.name == 'text') {
				(node as unknown as TermText).lp = this.logPointService
			}
		})
	}
}