import { Directive } from '@angular/core'

/**
 * The basic building block for templates. Think of it as `div` for the terminal.
 *
 * @example
 * <box>Some text</box>
 */
// This directive does nothing. It's just there for autocompletion from Angular.
// This is handled by the dom - terminal renderer.
@Directive({
  selector: 'box',
})
export class Box {}
