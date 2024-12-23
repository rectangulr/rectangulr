import { Directive, ElementRef, inject } from '@angular/core'
import { Element } from '../../angular-terminal/dom-terminal/sources/core/index'

/**
 * Think of it as `div` for the terminal. The basic building block for templates.
 * It displays its children horizontally.
 *
 * @example
 * <h>Same thing</h>
 */
// This directive does nothing. It's just there for autocompletion from Angular.
// This is handled by the dom - terminal renderer.
@Directive({
  standalone: true,
  selector: 'h',
})
export class HBox {
  elementRef = inject<ElementRef<Element>>(ElementRef);


  ngOnInit() {
    this.elementRef.nativeElement.style.add({ flexDirection: 'row' })
  }
}

/**
 * Think of it as `div` for the terminal. The basic building block for templates.
 * It displays its children vertically.
 * @example
 * <v>Some text</v>
 */
@Directive({
  standalone: true,
  selector: 'v',
})
export class VBox {
  elementRef = inject<ElementRef<Element>>(ElementRef);


  ngOnInit() {
    this.elementRef.nativeElement.style.add({ flexDirection: 'column' })
  }
}

/**
 * <v grow></v>
 */
@Directive({
  standalone: true,
  selector: '[grow]',
})
export class GrowDirective {
  elementRef = inject<ElementRef<Element>>(ElementRef);


  ngOnInit() {
    this.elementRef.nativeElement.style.add({ vgrow: true, hgrow: true })
  }
}

/**
 * Grow horizontally
 * @example <v hgrow></v>
 */
@Directive({
  standalone: true,
  selector: '[hgrow]',
})
export class HGrowDirective {
  elementRef = inject<ElementRef<Element>>(ElementRef);


  ngOnInit() {
    this.elementRef.nativeElement.style.add({ hgrow: true })
  }
}

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
