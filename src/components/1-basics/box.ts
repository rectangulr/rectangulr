import { Directive, ElementRef } from '@angular/core'
import { Element } from '../../angular-terminal/dom-terminal/sources/core/index'

/**
 * Think of it as `div` for the terminal. The basic building block for templates.
 * It displays its children horizontally.
 *
 * @example
 * <hbox>Same thing</hbox>
 */
// This directive does nothing. It's just there for autocompletion from Angular.
// This is handled by the dom - terminal renderer.
@Directive({
  standalone: true,
  selector: 'h, hbox',
})
export class HBox {
  constructor(public elementRef: ElementRef<Element>) {}

  ngOnInit() {
    this.elementRef.nativeElement.style.assign({ flexDirection: 'row' })
  }
}

/**
 * Think of it as `div` for the terminal. The basic building block for templates.
 * It displays its children vertically.
 * @example
 * <vbox>Some text</vbox>
 */
@Directive({
  standalone: true,
  selector: 'v, vbox',
})
export class VBox {
  constructor(public elementRef: ElementRef<Element>) {}

  ngOnInit() {
    this.elementRef.nativeElement.style.assign({ flexDirection: 'column' })
  }
}
