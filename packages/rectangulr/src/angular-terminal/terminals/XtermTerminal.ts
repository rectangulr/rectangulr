import type { Terminal as XtermRef } from "xterm"
import { EventDispatch } from "../../utils/event-handler"
import { Disposable, Queue } from "../../utils/queue"
import { Input } from "../dom-terminal/dom/TermScreen"
import { TERMINAL, Terminal } from './Terminal'
import { StaticProvider } from "@angular/core"
import { TODO } from "../../utils/utils"



export class XTermTerminal implements Terminal {
	name = 'XTermTerminal'
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

			size = () => ({ width: this.xterm.cols, height: this.xterm.rows })

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


export function provideXtermJs(xterm: XtermRef): StaticProvider {
	return {
		provide: TERMINAL, useFactory: () => {
			return new XTermTerminal(xterm)
		}
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

