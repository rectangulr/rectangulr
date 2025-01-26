import { computed, inject, Injectable } from "@angular/core"
import json5 from 'json5'
import { Logger, LOGGER } from "../angular-terminal/logger"
import { signal2 } from "../utils/Signal2"
import { LogName, Match, MatchType, Selector } from "./LogPointTypes"
import { TAGS } from "./Tags"

@Injectable({
	providedIn: 'root'
})
export class LogPointService implements Logger {
	logger = inject(LOGGER)
	tags = inject(TAGS, { optional: true }) || []
	parent = inject(LogPointService, { optional: true, skipSelf: true })
	root: LogPointService = undefined

	constructor() {
		if (isRoot(this)) {
			this.root = this

			if (typeof process !== 'undefined') {
				if (process.env?.BREAKPOINTS) {
					this.bpSelectorString.$ = process.env.BREAKPOINTS
				}
				if (process.env?.LOGPOINTS) {
					this.lpSelectorString.$ = process.env.LOGPOINTS
				}
			}

			globalThis['lp'] = this
		} else {
			this.root = this.parent.root
		}
	}

	bpSelectorString = signal2('')

	bpSelector = computed<Selector>(() => {
		if (isRoot(this)) {
			return this.bpSelectorString().split(',').map(s => s.trim())
		} else {
			return this.parent.bpMatch().nextSelector
		}
	})

	bpMatch = computed<Match>(() => {
		return matchSelector(this.bpSelector(), this.tags)
	})

	lpSelectorString = signal2('')

	lpSelector = computed<Selector>(() => {
		if (isRoot(this)) {
			return this.lpSelectorString().split(',').map(s => s.trim())
		} else {
			return this.parent.lpMatch().nextSelector
		}
	})

	lpMatch = computed<Match>(() => {
		return matchSelector(this.lpSelector(), this.tags)
	})

	runtimeLogPoints = new Set<LogName>()

	logPoint(name: LogName, context?: any) {
		this.runtimeLogPoints.add(name)

		if (context && matchesLogPoint(this.lpMatch(), name)) {
			this.logger.log(context)
		}
		if (matchesLogPoint(this.bpMatch(), name)) {
			debugger
		}
	}

	log(thing: any) {
		this.logger.log(thing)
	}

	toStringLp() {
		return stringifyPathToNode(this, stringifyNodeLp)
	}

	toStringBp() {
		return stringifyPathToNode(this, stringifyNodeBp)
	}
}

function matchesLogPoint(serviceMatch: Match, logName: LogName) {
	if (serviceMatch.match == MatchType.FullMatch) {
		return true
	} else {
		const tags = logName.split('.')
		return matchSelector(serviceMatch.nextSelector, tags).match == MatchType.FullMatch
	}
}

function matchSelector(selector: Selector, tags: string[]): Match {
	if (selector.length == 0) {
		return { match: MatchType.FullMatch, nextSelector: [] }
	}
	const isTagPresent = tags.includes(selector[0])
	if (isTagPresent) {
		const nextSelector = selector.slice(1)
		if (nextSelector.length == 0) {
			return { match: MatchType.FullMatch, nextSelector }
		} else {
			return { match: MatchType.Match, nextSelector }
		}
	} else {
		return { match: MatchType.No, nextSelector: selector }
	}
}

function isRoot(node: LogPointService) {
	return node.parent === null
}

function stringifyPathToNode(node: LogPointService, stringifyFunc: (node: LogPointService) => string) {
	// Walk up the parents from the node
	const nodes = []
	let currentNode: LogPointService = node
	while (currentNode) {
		nodes.unshift(stringifyFunc(currentNode))
		currentNode = currentNode.parent
	}
	return nodes.reduce((prev, curr) => {
		return prev + "\n" + curr
	}, "")
}

function stringifyNodeBp(node: LogPointService) {
	return json5.stringify({ tags: node.tags, selector: node.bpSelector(), match: node.bpMatch() })
}

function stringifyNodeLp(node: LogPointService) {
	return json5.stringify({ tags: node.tags, selector: node.lpSelector(), match: node.lpMatch() })
}
