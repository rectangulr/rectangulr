import { streamToObservable } from '../../term-strings/parse/getCursorPosition'
import { Queue } from '../../utils/queue'
import { Input } from '../dom-terminal/sources/term/elements/TermScreen'
import { Terminal, TerminalInputs, TerminalScreen } from './terminal'


export class ProcessTerminal implements Terminal {
	inputs: TerminalInputs
	screen: TerminalScreen

	queue: Queue<Input>

	constructor(process: NodeJS.Process) {
		this.queue = new Queue<Input>()
		streamToObservable(process.stdin).subscribe({
			next: (data) => {
				this.queue.send({ type: 'raw', buffer: data })
			},
			complete: () => {
				// TODO: dispose
			}
		})

		this.inputs = {
			send: (input: Input) => {
				this.queue.send(input)
			},
			on: (event, func) => { debugger },
			subscribe: (func) => this.queue.subscribe(func),
			setRawMode: (yes) => {
				return process.stdin.setRawMode?.(yes)
			}
		}

		this.screen = {
			write: text => {
				process.stdout.write(text)
			},
			columns: process.stdout.columns,
			rows: process.stdout.rows,
			on: (event, func) => { return process.stdout.on(event, func) },
		}

	}
}
