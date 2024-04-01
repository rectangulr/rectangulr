import type { Terminal as XtermRef } from "xterm"
import { EventDispatch } from "../../utils/event-handler"
import { Disposable, Queue } from "../../utils/queue"
import { Input } from "../dom-terminal/sources/term/elements/TermScreen"
import { Terminal } from './terminal'


export class XTermTerminal implements Terminal {
	inputs
	screen
	queue: Queue<Input>
	disposables: { dispose: () => void }[]
	encoder = new TextEncoder()

	constructor(xterm: XtermRef) {
		this.inputs = new class {
			queue = new Queue<Input>()
			eventDispatch = new EventDispatch()

			send(input: Input) {
				this.queue.send(input)
			}

			subscribe(func: (input: Input) => void): Disposable {
				return this.queue.subscribe(func)
			}

			on(event: string, func: () => void) {
				return this.eventDispatch.on(event, func)
			}
		}()

		this.screen = new class {
			eventHandler = new EventDispatch()

			constructor(public xterm: XtermRef) { }

			write(text: string) {
				this.xterm.write(text)
			}

			columns = this.xterm.cols
			rows = this.xterm.rows

			on(event, func) {
				return this.eventHandler.on(event, func)
			}
		}(xterm)

		this.disposables = [
			xterm.onData(data => {
				this.inputs.send({ type: 'raw', buffer: this.encoder.encode(data) })
			}),

			xterm.onResize(size => {
				this.screen.eventHandler.emit('resize', size)
			}),

		]
	}

	// @ts-ignore
	[Symbol.dispose]() {
		this.queue.dispose()
		this.disposables.forEach(disp => disp.dispose())
	}
}

export function mapDomKey(key: string): string {
	key = key.toLowerCase()
	if (key == 'arrowleft') return 'left'
	if (key == 'arrowright') return 'right'
	if (key == 'arrowdown') return 'down'
	if (key == 'arrowup') return 'up'
	return key
}
