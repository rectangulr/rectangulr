import { streamToObservable } from '../../term-strings/parse/getCursorPosition'
import { Queue } from '../../utils/queue'
import { Input } from '../dom-terminal/sources/term/elements/TermScreen'
import { Terminal, TerminalInputs, TerminalScreen } from './terminal'


export class ProcessTerminal implements Terminal {
	inputs: TerminalInputs
	screen: TerminalScreen

	constructor(process: NodeJS.Process) {

		this.inputs = new class {
			queue = new Queue<Input>()
			constructor(public process: NodeJS.Process) {
				streamToObservable(process.stdin).subscribe({
					next: (data) => {
						this.queue.send({ type: 'raw', buffer: data })
					},
					complete: () => {
						// TODO: dispose
					}
				})
			}

			send = (input: Input) => {
				this.queue.send(input)
			}
			on = (event, func) => { debugger }
			subscribe = (func) => this.queue.subscribe(func)
			setRawMode = (yes) => {
				return this.process.stdin.setRawMode?.(yes)
			}
		}(process)

		this.screen = new class {
			constructor(public process: NodeJS.Process) { }
			write = text => {
				this.process.stdout.write(text)
			}
			columns = this.process.stdout.columns
			rows = this.process.stdout.rows
			on = (event, func) => { return this.process.stdout.on(event, func) }
		}(process)

	}
}
