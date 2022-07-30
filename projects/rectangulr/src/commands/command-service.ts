import { Injectable } from '@angular/core'
import { Logger } from '../lib/logger'
import { State } from '../utils/reactivity'

export interface Command {
  id: string
  func: (args) => void
}

@Injectable({
  providedIn: 'root',
})
export class CommandsService {
  commands: State<{ [key: string]: Command }>

  constructor(public logger: Logger) {
    this.commands = new State({})
  }

  register({ id, func }) {
    const command = { id: id, func: func }
    this.commands.value[id] = command
    this.commands.changed()
    return command
  }

  executeCommand(info: { id: string; args?: any }) {
    const command = this.commands.value[info.id]
    command?.func(info.args)
  }

  getCommand(id) {
    const command = this.commands.value[id]
    if (command == null) {
      this.logger.log(`command ${id} doesnt exist`)
    }
    return command
  }
}
