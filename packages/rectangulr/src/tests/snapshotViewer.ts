import fs from 'fs'
import { cursor, feature, screen } from '../term-strings/core'

main()
function main() {
	let filePath = undefined
	const snapshotsDir = './src/tests/error-snapshots'
	try {
		const files = fs.readdirSync(snapshotsDir)
		if (files.length === 0) {
			console.error('No snapshot files found')
			process.exit(1)
		}
		filePath = `${snapshotsDir}/${files[0]}`
	} catch (err) {
		console.error('Error reading snapshots directory:', err.message)
		process.exit(1)
	}

	prepareTerminal({ write: console.log })
	try {
		const buffer = fs.readFileSync(filePath, 'utf8')
		view(buffer)
	} catch (err) {
		console.error('Error reading file:', err.message)
		process.exit(1)
	}
}

function view(buffer: string) {
	console.log(buffer)
	setTimeout(() => { }, 10000)
}

function prepareTerminal(writer: Writer) {
	// if (RECTANGULR_TARGET == 'node') {
	// 	this.terminal.inputs.setRawMode(true)
	// }

	// // Enter the alternate screen
	// writer.write(screen.alternateScreen.in)

	// Disable the terminal soft wrapping
	writer.write(screen.noWrap.in)

	// Hide the cursor (it will be renderer with everything else later)
	writer.write(cursor.hidden)

	writer.write(screen.clear)

	// Enable mouse tracking (all events are tracked, even when the mouse button isn't pressed)
	writer.write(feature.enableMouseHoldTracking.in)
	writer.write(feature.enableMouseMoveTracking.in)
	writer.write(feature.enableExtendedCoordinates.in)
}

export interface Writer {
	write: (str: string) => void
}
