import * as _ from '@s-libs/micro-dash'
import chokidar from 'chokidar'
import { $, fs, argv } from 'zx'
// import * as parser from 'node-html-parser'

async function main() {
	try {
		fs.access('../starter/dist')
	} catch (e) {
		console.error('../starter/dist does not exist.')
		return
	}
	await $`mkdir -p ./dist`.catch(() => { })

	// Copy website files
	await $`cp ./src/style.css ./dist/`
	await $`cp ./src/website.js ./dist/`
	await $`cp -r ./src/images ./dist/`
	await $`cp ./src/reload.js ./dist/`

	// Generate pages
	let shell = await readFile('./src/shell.html')
	shell = await render(shell)

	for (const file of await fs.readdir('./src/pages')) {
		let pageContent = await readFile(`./src/pages/${file}`)
		const page = await render(pageContent)
		const fullPage = await renderShell(shell, page)
		await fs.writeFile(`./dist/${file}`, fullPage)
	}

	// Copy example app
	await $`cp ../starter/dist/browser/*.js ./dist/`
	await $`cp ./dev/missing.js ./dist/`
}

function renderShell(shell: string, page: string) {
	return shell.replace('<build placeholder />', page)
}

/**
 * Input: <build src="./file.html"></build>
 * Output: Replaced with the content of the file
 */
async function render(page: string) {
	const regex = /<build src="([^"]+)"\/>/g

	let match
	while ((match = regex.exec(page)) !== null) {
		const src = match[1]
		let content
		try {
			content = await fs.readFile(src, 'utf-8')
		} catch (error) {
			console.log(`render error: ${src}`)
		}
		page = page.replace(match[0], content)
	}

	return page
}

async function readFile(path: string) {
	return fs.readFile(path).then((buffer) => buffer.toString())
}

if (argv['watch']) {
	const inputs = ['./src', '../starter/dist/browser/*.js', './dev/missing.js']
	chokidar.watch(inputs).on('change', _.debounce(() => {
		main()
	}, 100))
	main()
	if (argv['serve']) {
		$`npx live-server dist`
	}
	console.log(`Watching ${inputs.join(', ')}`)
} else {
	main()
}
