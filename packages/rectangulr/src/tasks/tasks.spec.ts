import { fakeAsync, tick } from "@angular/core/testing"
import { Tasks } from "./Tasks"

describe('Tasks', () => {

	it('queue UI, UI first', fakeAsync(() => {
		const tasks = new Tasks()
		const results = []
		tasks.queue({ func: () => { results.push('work') }, debounce: 16 })
		tasks.queue({ func: () => { results.push('UI') }, debounce: 0 })
		tick(1000)
		expect(results).toEqual(['UI', 'work'])
	}))

	it('queue 2', fakeAsync(() => {
		const tasks = new Tasks()
		const results = []
		tasks.queue({ func: () => { results.push('UI') }, debounce: 0 })
		tasks.queue({ func: () => { results.push('work') }, debounce: 1000 })
		tick(10)
		expect(results).toEqual(['UI'])
	}))

	it('queue UI while UI, both UI first', fakeAsync(() => {
		const tasks = new Tasks()
		const results = []
		tasks.queue({
			debounce: 0, func: () => {
				results.push('UI1')
				tasks.queue({
					debounce: 0, func: () => {
						results.push('UI2')
					}
				})
			}
		})
		tasks.queue({ debounce: 16, func: () => { results.push('work') } })
		tick(1000)
		expect(results).toEqual(['UI1', 'UI2', 'work'])
	}))

	it('await', fakeAsync(async () => {
		const tasks = new Tasks()
		tasks.queue({ debounce: 0, func: () => { } })
		tasks.queue({ debounce: 16, func: () => { } })
		let nb = 0
		tasks.waitForGroup(16).then(() => {
			nb = 1
		})
		tick(1000)
		expect(nb).toEqual(1)
	}))

	it('queueOnce when same name', fakeAsync(() => {
		const tasks = new Tasks()
		const results = []
		tasks.queueOnce({ debounce: 0, name: 'a', func: () => { results.push('UI') } })
		tasks.queueOnce({ debounce: 0, name: 'a', func: () => { results.push('UI') } })
		tick(1000)
		expect(results).toEqual(['UI'])
	}))

	it('dont queueOnce when different names', fakeAsync(() => {
		const tasks = new Tasks()
		const results = []
		tasks.queueOnce({ debounce: 0, name: 'a', func: () => { results.push('UI') } })
		tasks.queueOnce({ debounce: 0, name: 'b', func: () => { results.push('UI') } })
		tick(1000)
		expect(results).toEqual(['UI', 'UI'])
	}))

})
