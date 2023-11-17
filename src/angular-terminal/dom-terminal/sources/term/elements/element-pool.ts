import { Injectable, Injector, runInInjectionContext } from "@angular/core"
import { TermElement } from "."
import { assert } from "../../../../../utils/utils"
import { Logger } from "../../../../logger"
import { TermText2 } from "./TermText2"

/**
 * ElementPool
 */
@Injectable({
	providedIn: 'root'
})
export class ElementPool {
	elementClasses = [TermElement, TermText2]
	elementClassesByName = new Map<string, typeof TermElement>()
	elementPools = new Map<typeof TermElement, TermElement[]>()

	constructor(public injector: Injector, public logger: Logger) {
		this.elementClassesByName = new Map()
		this.elementPools = new Map()
		this.elementClasses.forEach(el => {
			const name = el.elementName
			this.elementClassesByName.set(name, el)

			this.elementPools.set(el, [])
		})
	}

	/**
	 * Creates an HTML element.
	 * Or returns an old one from the pool.
	 */
	create(name: string) {
		let elementContructor = this.elementClassesByName.get(name) || TermElement

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
		const objectPooling = true
		if (objectPooling) {
			const elPool = this.elementPools.get(el.constructor as any)
			if (elPool) {
				elPool.push(el)
				runInInjectionContext(this.injector, () => {
					el.reset()
					assert(el.parentNode == null)
					assert(el.childNodes.length == 0)
				})
			}
			// this.logger.log({ message: 'push', id: el.id })
		}
	}
}