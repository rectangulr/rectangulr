class Dep {
	name: string
	reads = new Set<Call>()
}

class Call {
	writes = new Set<string>()
	subCalls: Call[] = []
	depth = -1
	dirty = false
	building = false
	i = 0
	parentCall: Call
	name = 'anonymous'

	constructor(public func, public args?) { }

	toString() {
		return this.name
	}
}

export class BuildGraph {
	parentCall: Call
	dirtyKeys = new Set<string>()
	deps: Record<string, Dep> = {}
	running = false
	timeout: any | null = null
	rootCall: Call
	autoRerun = true

	constructor() {
		this.rootCall = new Call(() => { })
		this.rootCall.depth = 0
		this.rootCall.building = true
		this.rootCall.name = 'root'
		this.parentCall = this.rootCall
	}

	r = (name: string) => {
		assert(this.parentCall, `r() should be called inside a call()`)
		this.deps[name] ||= new Dep()
		this.deps[name].reads.add(this.parentCall)
		return name
	}

	w = (name: string) => {
		if (this.running) {
			this.parentCall.writes.add(name)
		} else {
			this.dirtyKeys.add(name)
			if (this.autoRerun) {
				this.rerunOnNextTick()
			}
		}
		return name
	}

	call = <T extends Array<any>, U>(func: (...args: T) => U, ...args: T) => {
		const parentCall = this.parentCall
		let subCall: Call | undefined = undefined
		if (parentCall.building) {
			const call = new Call(func, args)
			call.building = parentCall.building
			call.depth = parentCall.depth + 1
			call.parentCall = parentCall
			call.name = (func.name || 'anonymous') + '-' + parentCall.i
			parentCall.subCalls.push(call)
			subCall = call
		} else {
			subCall = parentCall.subCalls[parentCall.i]
			assert(subCall, `subCall not found`)
			assert(subCall.func == func)
		}

		return this.call2(subCall)
	}

	private call2<T extends Array<any>, U>(thecall: Call) {
		let res = undefined as any

		const previous = this.parentCall
		this.parentCall = thecall
		thecall.i = 0
		try {
			res = thecall.func(...thecall.args)
		} finally {
			thecall.dirty = false
			thecall.building = false
			this.parentCall = previous
			previous.i++
		}
		return res
	}

	rerunOnNextTick() {
		if (this.timeout === null) {
			this.timeout = setTimeout(() => {
				this.rerun()
				this.timeout = null
			}, 0)
		}
	}

	rerun() {
		this.running = true

		// Mark dirty calls
		const dirtyCallsSet = new Set<Call>()
		for (const key of this.dirtyKeys) {
			this.deps[key] ||= new Dep()
			const dep = this.deps[key]
			for (const call of dep.reads) {
				call.dirty = true
				dirtyCallsSet.add(call)
				for (const write of call.writes) {
					this.dirtyKeys.add(write)
				}
			}
		}

		// Sort calls by depth
		const dirtyCalls = Array.from(dirtyCallsSet)
		dirtyCalls.sort((a, b) => a.depth - b.depth)

		// Run calls
		try {
			for (const callDef of dirtyCallsSet) {
				if (callDef.dirty) {
					assert(this.parentCall == this.rootCall)
					this.parentCall = callDef.parentCall
					this.call2(callDef)
					this.parentCall = this.rootCall
				}
			}
		} finally {
			this.dirtyKeys.clear()
			this.running = false
		}
		this.timeout = null
	}
}

if (process.env.TEST) {
	const graph = new BuildGraph()
	const { r, w, call } = graph

	call(build)

	console.log("\n\nChange " + w('middle.html'))

	async function build() {
		call(readFile, 'input.html')
		console.log('building...')
		call(writeFile, 'middle.html', 'middle')
		call(() => {
			readFile('middle.html')
			writeFile('output.html', 'output')
		})
	}

	function readFile(path: string) {
		console.log(`Reading ${r(path)}`)
	}

	function writeFile(path: string, content: string) {
		console.log(`Writing ${w(path)} : ${content}`)
	}
}


// ------------------------------

function assert(condition: any, message?: string): asserts condition {
	if (!condition) {
		debugger
		// throw new Error(message)
	}
}
