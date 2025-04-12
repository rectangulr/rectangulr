import { streamToObservable } from '../../term-strings/parse/getCursorPosition'
import { Queue } from '../../utils/queue'
import { Input } from '../dom-terminal/dom/TermScreen'
import { Terminal, TerminalInputs, TerminalScreen } from './Terminal'


export class ProcessTerminal implements Terminal {
	name = 'ProcessTerminal'
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
			size = () => {
				if (this.process.stdout.columns) {
					return { width: this.process.stdout.columns, height: this.process.stdout.rows }
				} else {
					return { width: 80, height: 25 }
				}
			}
			on = (event, func) => { return this.process.stdout.on(event, func) }
		}(process)

	}
}
