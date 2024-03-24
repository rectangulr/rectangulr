import { Directive, ElementRef, Input, Signal, computed } from '@angular/core'
import { Element } from '../../angular-terminal/dom-terminal'
import { StyleValue } from '../../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'

type StyleValueOrSignal = StyleValue | Signal<StyleValue>

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
  @Input() s: StyleValueOrSignal | StyleValueOrSignal[]

  constructor(public element: ElementRef<Element>) { }

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
