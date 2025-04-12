import { Injectable } from "@angular/core"
import { assert } from "../utils/Assert"

const DEFAULT_DEBOUNCE = 40

@Injectable({
	providedIn: 'root',
})
export class Tasks {
	private idGenerator = 0
	private groups: {
		[debounce: number]: {
			debounce: number
			tasks: Task[]
			timeoutHandle: any | undefined
			promiseLike: Thenable
		}
	} = {}
	currentTask: Task | undefined = undefined
	once = new Set<string>()

	queue(task: Task) {
		const newTask: Task = {
			debounce: DEFAULT_DEBOUNCE,
			...task,
			id: this.idGenerator++,
		}
		const group = this.ensureGroup(newTask.debounce)
		group.tasks.push(newTask)

		if (group.timeoutHandle === undefined) {
			group.timeoutHandle = setTimeout(() => this.run(newTask.debounce), newTask.debounce)
		}
	}

	private run(debounce: number) {
		const group = this.ensureGroup(debounce)
		assert(group)

		for (const task of group.tasks) {
			this.currentTask = task
			try {
				task.func()
			} catch (e) {
				throw e
			} finally {
				this.currentTask = undefined
			}
			this.once.delete(task.name)
		}
		group.tasks.length = 0
		group.timeoutHandle = undefined

		// if we just ran the debounce=0 tasks, reset the timeouts
		if (debounce === 0) {
			this.resetTimeouts()
		}
	}

	resetTimeouts() {
		for (const group of Object.values(this.groups)) {
			if (group.debounce > 0 && group.tasks.length > 0) {
				clearTimeout(group.timeoutHandle)
				group.timeoutHandle = setTimeout(() => this.run(group.debounce), group.debounce)
			}
		}
	}

	queueOnce(task: Task & { name: string }) {
		this.ensureGroup(task.debounce)

		if (!this.once.has(task.name)) {
			this.once.add(task.name)
			this.queue(task)
		}
	}

	waitForGroup(debounce: number): Thenable {
		const group = this.ensureGroup(debounce)
		return group.promiseLike
	}

	private ensureGroup(debounce: number = DEFAULT_DEBOUNCE) {
		if (!this.groups[debounce]) {
			const group = {
				debounce, tasks: [], timeoutHandle: undefined, promiseLike: {
					then: (callback) => {
						this.queue({
							debounce,
							func: callback,
						})
					}
				}
			}
			this.groups[debounce] = group
			return group
		}
		return this.groups[debounce]
	}

	static UI = 0
	static work = DEFAULT_DEBOUNCE
	static background = 1000
}


export type Task = {
	id?: number
	name?: string
	debounce?: number
	func: () => any
}

type Thenable = {
	then: (callback: () => any) => void
}
