import { Directive, ElementRef } from '@angular/core'
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
  constructor(public elementRef: ElementRef<Element>) { }

  ngOnInit() {
    this.elementRef.nativeElement.style.assign({ flexDirection: 'row' })
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
  constructor(public elementRef: ElementRef<Element>) { }

  ngOnInit() {
    this.elementRef.nativeElement.style.assign({ flexDirection: 'column' })
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
  constructor(public elementRef: ElementRef<Element>) { }

  ngOnInit() {
    this.elementRef.nativeElement.style.assign({ vgrow: true, hgrow: true })
  }
}

/**
 * <v hgrow></v>
 */
@Directive({
  standalone: true,
  selector: '[hgrow]',
})
export class HGrowDirective {
  constructor(public elementRef: ElementRef<Element>) { }

  ngOnInit() {
    this.elementRef.nativeElement.style.assign({ hgrow: true })
  }
}

/**
 * <v vgrow></v>
 */
@Directive({
  standalone: true,
  selector: '[vgrow]',
})
export class VGrowDirective {
  constructor(public elementRef: ElementRef<Element>) { }

  ngOnInit() {
    this.elementRef.nativeElement.style.assign({ vgrow: true })
  }
}
