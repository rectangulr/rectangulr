import { Directive, Input } from '@angular/core'
import { assert } from 'console'
import { Observable, Subscription } from 'rxjs'
import { CommandService } from './command-service'

@Directive({
  selector: '[focus]',
})
export class FocusDirective {
  @Input() focus: Observable<any>

  subscription: Subscription = null

  constructor(public commandService: CommandService) {}

  ngOnInit() {
    assert(this.focus)
    this.subscription = this.focus.subscribe(() => {
      this.commandService.focus()
    })
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }
}

@Directive({
  selector: '[focusSeparate]',
  providers: [CommandService],
})
export class FocusSeparateDirective {
  @Input() focusSeparate: Observable<any>

  subscription: Subscription = null

  constructor(public commandService: CommandService) {}

  ngOnInit() {
    this.subscription = this.focusSeparate.subscribe(() => {
      this.commandService.focus()
    })
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }
}
