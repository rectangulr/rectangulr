import { computed, inject, Injectable, Signal } from "@angular/core"
import { Logger, LOGGER } from "../angular-terminal/logger"
import { signal2 } from "./Signal2"
import { TAGS } from "./Tags"

@Injectable({
	providedIn: 'root'
})
export class LogPointRootService {

	constructor() {
		let envBreakpoints: string[] = []
		if (typeof process !== 'undefined') {
			if (process.env?.BREAKPOINTS) {
				envBreakpoints = process.env.BREAKPOINTS.split(',').map(s => s.trim())
				for (const breakPoint of envBreakpoints) {
					this.bpEnable(breakPoint)
				}
			}
			if (process.env?.LOGPOINTS) {
				const envLogPoints = process.env.LOGPOINTS.split(',').map(s => s.trim())
				for (const logPoint of envLogPoints) {
					this.lpEnable(logPoint)
				}
			}
		}
		for (const breakpoint of envBreakpoints) {
			this.bpEnable(breakpoint)
		}
	}

	private enabledBreakpoints = new Array<string>()
	private enabledLogPoints = new Set<string>()

	bpEnable(name: string): void {
		this.enabledBreakpoints.push(name)
	}

	bpEnabled(name: string): boolean {
		return this.enabledBreakpoints.includes(name)
	}

	bpDisable(name: string): void {
		this.enabledBreakpoints = this.enabledBreakpoints.filter(bp => bp !== name)
	}

	lpEnable(name: string): void {
		this.enabledLogPoints.add(name)
	}

	lpEnabled(name: string): boolean {
		return this.enabledLogPoints.has(name)
	}

	lpDisable(name: string): void {
		this.enabledLogPoints.delete(name)
	}
}


type LPName = string
type Selector = string[]

@Injectable({
	providedIn: 'root'
})
export class LogPointService implements Logger {
	root = inject(LogPointRootService)
	logger = inject(LOGGER)
	tags = inject(TAGS, { optional: true })
	parent = inject(LogPointService, { optional: true, skipSelf: true })

	private runtimeLogPoints = new Set<LPName>()

	selector = computed<Selector>(() => {
		if (this.parent) {
			return this.parent.match().nextSelector
		} else {
			return []
		}
	})

	match: Signal<{ matches: boolean, nextSelector: Selector }> = computed(() => {
		if (this.selector().length == 0) {
			return { matches: true, nextSelector: [] }
		}
		debugger
		const isTagIncluded = this.tags.includes(this.selector()[0])
		return { matches: isTagIncluded, nextSelector: this.selector().slice(1) }
	})

	name = signal2<LPName | undefined>(undefined)

	logPoint(name: LPName, context?: any) {
		if (!this.match().matches) {
			return
		}

		this.runtimeLogPoints.add(name)
		if (this.root.lpEnabled(name)) {
			this.logger.log(context)
		}
		if (this.root.bpEnabled(name)) {
			debugger
		}
	}

	log(message) {

	}
}
