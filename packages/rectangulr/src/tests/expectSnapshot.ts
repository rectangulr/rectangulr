import fs from "fs"
import { renderToString } from "./utils"

export function expectSnapshot(name, comp) {
	let loaded = ''
	try {
		loaded = fs.readFileSync(`./src/tests/snapshots/${name}.txt`).toString()
	} catch (error) {
	}
	const buffer = renderToString(comp)
	if (loaded != buffer) {
		if (process.env['UPDATE_SNAPSHOTS']) {
			console.log('Updating snapshot', name)
			fs.writeFileSync(`./src/tests/snapshots/${name}.txt`, buffer)
		} else {
			fs.writeFileSync(`./src/tests/error-snapshots/${name}.txt`, buffer)
		}
	}
}
