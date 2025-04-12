import { inject, Injectable, Injector, runInInjectionContext } from "@angular/core"
import { assert } from "../../../utils/Assert"
import { LOGGER } from "../../logger"
import { TermElement } from "./TermElement"
import { TermText } from "./TermText"
import { TermContainer } from "./TermContainer"

type TermElementConstructor = typeof TermElement

/**
 * ElementPool
 */
@Injectable({
	providedIn: 'root'
})
export class ElementPool {
	injector = inject(Injector)
	logger = inject(LOGGER)

	enabled = false
	elementClasses: TermElementConstructor[] = [TermContainer, TermText]
	elementClassesByName = new Map<string, TermElementConstructor>()
	elementPools = new Map<TermElementConstructor, TermElement[]>()

	constructor() {
		this.elementClassesByName = new Map()
		this.elementPools = new Map()
		this.elementClasses.forEach(el => {
			const name = el.className
			this.elementClassesByName.set(name, el)

			this.elementPools.set(el, [])
		})
	}

	/**
	 * Creates an HTML element.
	 * Or returns an old one from the pool.
	 */
	create(name: string): TermElement {
		let elementContructor = this.elementClassesByName.get(name) || TermContainer

		const elPool = this.elementPools.get(elementContructor)
		if (elPool.length > 0) {
			const el = elPool.pop()
			// this.logger.log({ message: 'pop', id: el.id })
			return el
		} else {
			let el: TermElement
			runInInjectionContext(this.injector, () => {
				el = new elementContructor()
			})
			// this.logger.log({ message: 'create', id: el.id })
			return el
		}
	}

	/**
	 * Resets an element, and puts it back in the pool.
	 */
	pool(el: TermElement) {
		if (this.enabled) {
			const elPool = this.elementPools.get(el.constructor as any)
			if (elPool) {
				runInInjectionContext(this.injector, () => {
					el.reset()
					assert(el.parentNode == null)
					assert(el.childNodes.length == 0)
				})
				elPool.push(el)
			}
			// this.logger.log({ message: 'push', id: el.id })
		}
	}
}