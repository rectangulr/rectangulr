export class EventDispatch {
	private listeners: { [event: string]: ((...args: any[]) => void)[] } = {}
	on(event: string, func: (...args: any[]) => void) {
		if (!this.listeners[event]) {
			this.listeners[event] = []
		}
		this.listeners[event].push(func)

		return () => {
			this.off(event, func)
		}
	}

	emit(event: string, ...args: any[]) {
		if (!this.listeners[event]) {
			return
		}
		for (const listener of this.listeners[event]) {
			listener(...args)
		}
	}

	off(event: string, func: (...args: any[]) => void) {
		if (!this.listeners[event]) {
			return
		}
		const index = this.listeners[event].indexOf(func)
		if (index !== -1) {
			this.listeners[event].splice(index, 1)
		}
	}

	dispose() {
		this.listeners = {}
	}
}