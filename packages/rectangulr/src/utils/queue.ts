type Callback<T> = (event: T) => void

export class Queue<T> {
	subscribers: (Callback<T>)[] = []

	send(event: T) {
		this.subscribers.forEach(func => {
			func(event)
		})
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
