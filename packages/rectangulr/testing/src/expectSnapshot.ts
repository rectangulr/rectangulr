import { TestBed } from "@angular/core/testing"
import { TermElement } from "@rectangulr/rectangulr"
import fs from "fs"
import { assert } from './Assert'

export function renderToAnsiCodes(comp: any) {
	const fixture = TestBed.createComponent(comp)
	const el: TermElement = fixture.elementRef.nativeElement
	fixture.detectChanges()
	assert(el.rootNode?.frame)
	el.rootNode.render('full', el.rootNode.frame)
	return el.rootNode.frame.renderAnsiCodes('full')
}

export function renderToPlainText(comp: any) {
	const fixture = TestBed.createComponent(comp)
	const el: TermElement = fixture.elementRef.nativeElement
	fixture.detectChanges()
	assert(el.rootNode?.frame)
	el.rootNode.updateDirtyNodes()
	el.rootNode.render('full', el.rootNode.frame)
	return el.rootNode.frame.renderToPlainText()
}

/**
 * Compares a value with a stored snapshot and updates the snapshot if necessary.
 * If the snapshot doesn't match and UPDATE_SNAPSHOTS environment variable is set,
 * it will update the snapshot file. If UPDATE_SNAPSHOTS is not set, it will still
 * write the new value to the snapshot file.
 *
 * @param name - The name of the snapshot file (without extension)
 * @param value - The value to compare against the snapshot
 *
 * @remarks
 * Snapshots are stored in the '__snapshots__' directory with '.txt' extension
 * If the snapshot file doesn't exist, it will be created with the provided value
 */
export function expectSnapshot(name: string, value: string, update = false) {
	const snapshotDir = './src/tests/snapshots'

	if (!fs.existsSync(snapshotDir)) {
		fs.mkdirSync(snapshotDir)
	}
	const filePath = `${snapshotDir}/${name}.txt`

	if (process.env['UPDATE_SNAPSHOTS'] || update) {
		console.log('Updating snapshot', name)
		fs.writeFileSync(filePath, value)
	} else {
		let loaded = ''
		try {
			loaded = fs.readFileSync(filePath).toString()
		} catch (e) { }
		expect(value).toEqual(loaded)
		if (value !== loaded) {
			const errorFile = `./src/tests/error-snapshots/${name}.txt`
			fs.writeFileSync(errorFile, value)
		}
	}
}

/**
 * Compares an Angular component's rendered output with a stored snapshot and updates it if necessary.
 *
 * @param name - The name of the snapshot file to be created/compared
 * @param comp - The Angular component to be rendered and compared
 *
 * @remarks
 * The function will:
 * 1. Try to load an existing snapshot from `__snapshots__/{name}.txt`
 * 2. Render the provided component to a string
 * 3. Compare the rendered output with the existing snapshot
 * 4. Update the snapshot file if:
 *    - No snapshot exists
 *    - The snapshots don't match
 *    - The UPDATE_SNAPSHOTS environment variable is set
 *
 * @example
 * ```typescript
 * expectSnapshotComponent('MyComponent', MyComponent);
 * ```
 */
export function expectSnapshotComponentAnsi(name: string, comp: any, update = false) {
	const codes = renderToAnsiCodes(comp)
	const buffer = JSON.stringify(codes)
	expectSnapshot(name, buffer, update)
}

export function expectSnapshotComponentText(name: string, comp: any, update = false) {
	const res = renderToPlainText(comp)
	expectSnapshot(name, res, update)
}
