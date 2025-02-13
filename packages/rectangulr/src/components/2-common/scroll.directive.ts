import { Directive, ElementRef, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { fromEvent } from 'rxjs'
import { TermElement } from '../../angular-terminal/dom-terminal'
import { LogPointService } from '../../logs/LogPointService'
import { Mouse } from '../../term-strings/parse'

@Directive({
	selector: '[scroll]',
	providers: [LogPointService],
	standalone: true,
})
export class Scroll {
	private lp = inject(LogPointService)
	private element = inject<ElementRef<TermElement & Element>>(ElementRef).nativeElement

	constructor() {
		this.element.style.add({ scrollF: 'y' })
		this.element.style.addChildren({ flexShrink: 0 })
		fromEvent(this.element, 'mousewheel')
			.pipe(
				takeUntilDestroyed(),
			)
			.subscribe(e => {
				const event = e['mouse'] as Mouse
				this.lp.logPoint('Scroll', { d: event.d })
				this.element.scrollTop += event.d * 2
			})
	}
}