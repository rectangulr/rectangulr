type Callback<T> = (event: T) => void

export class Queue<T> {
	subscribers: (Callback<T>)[] = []
	current: T | null = null

	send(event: T) {
		if (this.current) {
			throw new Error('Queue is already processing an event')
		}
		this.current = event
		this.subscribers.forEach(func => {
			func(event)
		})
		this.current = null
	}

	subscribe(func: Callback<T>): Disposable {
		this.subscribers.push(func)
		return { dispose: () => { this.subscribers = this.subscribers.filter(i => i != func) } }
	}

	dispose() {
		this.subscribers = []
	}
}


export type Disposable = {
	dispose: () => void
}
