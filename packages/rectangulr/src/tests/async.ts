import { assert } from "./Assert"

let globalId = 0

export class TimerPatcher {
	id: number
	original: typeof setTimeout
	running = false
	timeouts: { func: Function, delay: number, args: any[] }[] = []
	intervals: { func: Function, delay: number, args: any[] }[] = []

	constructor() {
		this.id = ++globalId
		this.timeouts = []
		this.intervals = []
	}

	setTimeout(func: () => void, delay: number, ...args: any[]) {
		this.timeouts.push({ func, delay, args })
		return this.timeouts.length
	}

	clearTimeout() {
		throw new Error('Not implemented')
	}

	patchTimers() {
		this.original = globalThis['setTimeout']
		//@ts-ignore
		const func = (...args) => this.setTimeout(...args)
		func['TimerPatcher'] = this
		//@ts-ignore
		globalThis['setTimeout'] = func
	}

	unpatchTimers() {
		globalThis['setTimeout'] = this.original
	}

	tick() {
		assert(this.running === false)
		this.running = true

		this.timeouts.sort((a, b) => a.delay - b.delay)
		for (const t of this.timeouts) {
			t.func(...t.args)
		}
		this.running = false
	}
}

export function fakeAsync(func: (t?: TimerPatcher) => void): any {
	return () => {
		const t = patchTimers()
		func(t)
		t.unpatchTimers()
	}
}

function patchTimers() {
	const t = new TimerPatcher()
	t.patchTimers()
	return t
}
