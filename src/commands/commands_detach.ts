import { Directive, EventEmitter, inject, Output } from '@angular/core'
import { Logger } from '../angular-terminal/logger'
import { CommandService } from './command_service'

@Directive({
  selector: '[detachedCommandService]',
  providers: [
    {
      provide: CommandService,
      useFactory: () => {
        const logger = inject(Logger)
        const commandService = new CommandService(null, logger, null)
        return commandService
      },
    },
  ],
})
export class DetachedCommandServiceDirective {
  @Output() detachedCommandService = new EventEmitter()

  constructor(detachedCommandService: CommandService) {
    this.detachedCommandService.emit(detachedCommandService)
  }
}
