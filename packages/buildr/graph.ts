
export class Node {
	followers = new Set<Node>()
	deps = new Set<Node>()
	value: any = undefined
	running = false
	error: any = null

	constructor(public func: NodeFunc) { }

	then(func: NodeFunc) {
		const followingNode = new Node(func)
		this.followers.add(followingNode)
		followingNode.deps.add(this)
		return this
	}

	send(value?: any, from?: Node) {
		const afterRun = (res: any) => {
			this.value = res
			this.running = false
			for (const follower of this.followers) {
				follower.send(this)
			}
		}

		const deps = [...this.deps]
		if (deps.some(dep => dep.value === UNSET)) {
			return
		}

		let promise: any
		this.running = true
		try {
			const firstDepRes = deps.length > 0 ? deps[0].value : undefined
			const read = (node: Node) => {
				node.followers.add(this)
				this.deps.add(node)
				return new Promise((res) => node.value)
			}
			promise = this.func({ res: firstDepRes, next: afterRun, ref: this, read: read })
			if (promise) {
				if (isPromise(promise)) {
					promise.then(res => {
						afterRun(res)
					})
				} else if (isObservable(promise)) {
					promise.subscribe(res => {
						afterRun(res)
					})
				}
			} else {
				afterRun(undefined)
			}
		} catch (err) {
			this.value = ERRORED
			this.error = err
		}
	}
}

type NodeFunc = (args: { res?: any, next(value?: any): void, ref: Node, read: (node: Node) => any }) => any

export const UNSET = Symbol('UNSET')
export const COMPUTING = Symbol('COMPUTING')
export const ERRORED = Symbol('ERRORED')

export class Buildr {
	nodesToRun = new Set<Node>()
	running = false
	timeout: any | undefined

	runNextTick() {
		if (this.timeout === undefined) {
			this.timeout = setTimeout(() => {
				this.run()
				this.timeout = undefined
			})
		}
	}

	graph = this

	run() {
		this.running = true
		for (const node of this.nodesToRun) {
			this.nodesToRun.delete(node)
			node.send()
		}
		this.running = false
	}

	call = (func: NodeFunc) => {
		const call = new Node(func)
		this.nodesToRun.add(call)
		this.runNextTick()
		return call
	}

	value = (initialValue = undefined) => {
		const node = this.call(({ res }) => res)
		node.send(initialValue)
		return node
	}
}


function isPromise<T>(obj: any): obj is Promise<T> {
	return obj && typeof obj.then === 'function'
}

type Observable<T> = {
	subscribe(cb: (value: T) => void): void
}

function isObservable<T>(obj: any): obj is Observable<T> {
	return obj && typeof obj.subscribe === 'function'
}

function assert(condition: any, message?: string): asserts condition {
	if (!condition) {
		debugger
		// throw new Error(message)
	}
}

// @ts-ignore
if (process.env['TEST']) {
	const { call } = new Buildr()

	const angular = call(() => {
		console.log('First!')
	}).then(() => {
		console.log('Second!')
	}).then(() => {
		console.log('Third!')
	})
}
