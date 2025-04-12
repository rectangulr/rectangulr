import { TestBed } from '@angular/core/testing'
import { TermScreen } from './TermScreen'
import { TermText } from './TermText'
import { TermContainer } from './TermContainer'

function setup() {
	let screen: TermScreen
	let parent: TermContainer
	let textNode: TermText

	TestBed.runInInjectionContext(() => {
		screen = new TermScreen()
		parent = new TermContainer()
		screen.appendChild(parent)

		textNode = new TermText()
		parent.appendChild(textNode)
	})
	screen.updateDirtyNodes()
	return { screen, parent, textNode }
}

describe('TermText2 Content Measurements', () => {
	it('should measure multi-line content correctly', () => {
		const { screen, parent, textNode } = setup()
		textNode.textContent = 'aaa\naaa'
		screen.updateDirtyNodes()
		expect(textNode.getInternalContentHeight()).toEqual(2)
		expect(textNode.getInternalContentWidth()).toEqual(3)
	})

	it('should measure single-line content correctly', () => {
		const { screen, parent, textNode } = setup()
		textNode.textContent = 'aaaaaa'
		screen.updateDirtyNodes()
		expect(textNode.getInternalContentHeight()).toEqual(1)
		expect(textNode.getInternalContentWidth()).toEqual(6)
	})

	xit('should handle content with height constraints', () => {
		const { screen, parent, textNode } = setup()
		textNode.textContent = Array.from({ length: 20 }, (_, i) => i + 1).join('\n')

		parent.style.add({ maxHeight: 10 })
		screen.updateDirtyNodes()
		expect(textNode.getInternalContentHeight()).toEqual(10)
		expect(textNode.getInternalContentWidth()).toEqual(2)
	})
})
