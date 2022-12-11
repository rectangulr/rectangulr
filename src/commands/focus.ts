import { Directive, Input } from '@angular/core'
import { onChange } from '../utils/reactivity'
import { CommandService } from './command_service'

@Directive({
  selector: '[focusIf]',
})
export class FocusIfDirective {
  @Input() focusIf = false

  constructor(public commandService: CommandService) {
    onChange(this, 'focusIf', condition => {
      if (condition) {
        this.commandService.focus()
      }
    })
  }
}

@Directive({
  selector: '[focus]',
  providers: [CommandService],
})
export class FocusDirective {
  constructor(public commandService: CommandService) {
    this.commandService.focus()
  }
}

@Directive({
  selector: '[focusFromChildren]',
})
export class FocusFromChildrenDirective {
  @Input() focusFromChildren = false

  constructor(public commandService: CommandService) {
    this.commandService.focusFromChildren = this.focusFromChildren
  }
}
