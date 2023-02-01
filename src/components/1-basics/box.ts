import { Component, Directive, Input } from '@angular/core'
import { FocusDirective } from '../../commands/focus.directive'
import { ShortcutService } from '../../commands/shortcut.service'

/**
 * The basic building block for templates. Think of it as `div` for the terminal.
 *
 * @example
 * <box>Some text</box>
 */
// This directive does nothing. It's just there for autocompletion from Angular.
// This is handled by the dom - terminal renderer.
@Directive({
  standalone: true,
  selector: 'box',
})
export class Box {}

// @Component({
//   standalone: true,
//   selector: 'box [focus]',
//   template: `<ng-content></ng-content>`,
//   hostDirectives: [
//     { directive: FocusDirective, inputs: ['focusIf', 'focusPropagateUp', 'focusShortcuts'] },
//   ],
//   providers: [ShortcutService],
// })
// export class BoxFocus {
//   constructor(public shortcutService: ShortcutService) {}
// }
