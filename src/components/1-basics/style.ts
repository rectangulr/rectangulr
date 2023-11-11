import { Directive, ElementRef, Input, Signal } from '@angular/core'
import { TermElement } from '../../angular-terminal/dom-terminal'
import { StyleValue } from '../../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'

/**
 * Applies a style to the element.
 * @example
 * <h [s]="{color: 'red'}">Some red text</h>
 */
@Directive({
  standalone: true,
  selector: '[s]',
})
export class StyleDirective {
  @Input() s: StyleValue | Signal<StyleValue> | (StyleValue | Signal<StyleValue>)[]

  constructor(public element: ElementRef<TermElement>) { }

  ngOnInit() {
    if (Array.isArray(this.s)) {
      for (const style of this.s) {
        this.element.nativeElement.style.add(style)
      }
    } else {
      this.element.nativeElement.style.add(this.s)
    }
  }
}
