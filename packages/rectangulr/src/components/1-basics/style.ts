import { Directive, ElementRef, input, Input, Signal, signal, WritableSignal, inject } from '@angular/core'
import { Element } from '../../angular-terminal/dom-terminal'
import { StyleValue } from '../../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'
import { onChange } from '../../utils/reactivity'

type StyleValueOrSignal = StyleValue | Signal<StyleValue>

/**
 * Applies a style to the element.
 * @example
 * <h [s]="{color: 'red'}">Some red text</h>
 */
@Directive({
  standalone: true,
  selector: '[s],[st],[stv]',
})
export class StyleDirective {
  element = inject<ElementRef<Element>>(ElementRef);

  /**
   * Styles, one or multiple, to be applied in order.
   * Prefer putting signals at the end to simplify recomputing the aggregate style.
   * @example
   * Value: {color: 'red'}
   * Signal: computed(() => ({color: color()}))
   */
  readonly s = input<StyleValueOrSignal | StyleValueOrSignal[]>([])

  /**
   * Template styles.
   * Used for now to have styles than can react to $index in a @for (template variables).
   * Angular doesnt expose the index as a signal for now.
  */
  readonly st = input<TemplateStyle[]>([])

  /**
   * Template style variables : {key: value}
   * Example: {index: 3}
   * Passes them to their corresponding signal via key.
   * Example: signals[index].set(3)
   */
  // TODO: breaks if made into a signal
  @Input() stv: { [key: string]: any } = {}
  signals: { [key: string]: WritableSignal<any> } = {}

  ngOnInit() {
    // Add normal styles
    const s = this.s()
    if (Array.isArray(s)) {
      for (const style of s) {
        this.element.nativeElement.style.add(style)
      }
    } else {
      this.element.nativeElement.style.add(s)
    }

    // Create template variables signals
    for (const [key, value] of Object.entries(this.stv)) {
      this.signals[key] = signal(value)
    }

    // Add template styles
    for (const templateStyle of this.st()) {
      const computedStyle = templateStyle(this.signals)
      this.element.nativeElement.style.add(computedStyle)
    }

    // Update template variables
    onChange(this, 'stv', variables => {
      for (const [key, value] of Object.entries(variables)) {
        this.signals[key].set(value)
      }
    })
  }
}

export type TemplateStyle = (templateVars: { [key: string]: WritableSignal<any> }) => Signal<StyleValue>
