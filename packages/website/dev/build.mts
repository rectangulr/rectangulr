import * as _ from '@s-libs/micro-dash'
import chokidar from 'chokidar'
import { $, fs, argv } from 'zx'
import * as html from 'node-html-parser'
import markdown from 'markdown-it'
import hljs from 'highlight.js'
$.verbose = true

async function main() {
	try {
		fs.access('../starter/dist-web')
	} catch (e) {
		console.error('../starter/dist-web does not exist.')
		return
	}
	await $`mkdir -p ./dist`.catch(() => { })

	// Copy website files
	await $`cp ./src/style.css ./dist/`
	await $`cp ./src/website.js ./dist/`
	await $`cp -r ./src/images ./dist/`

	// Generate pages
	let shell = await readFile('./src/shell.html')
	shell = await render(shell)

	for (let filePath of await fs.readdir('./src/pages')) {
		let pageContent = await readFile(`./src/pages/${filePath}`)
		const page = await render(pageContent)
		const fullPage = await replacePlaceholder(shell, page)
		filePath = filePath.replace(/\.md$/, '.html')
		await fs.writeFile(`./dist/${filePath}`, fullPage)
	}

	// Copy example app
	await $`cp -r ../starter/dist-web ./dist/starter/`
}

const md = markdown({
	html: true,
	highlight: function (str, lang) {
		if (lang && hljs.getLanguage(lang)) {
			try {
				return (
					'<pre><code class="hljs">' +
					hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
					"</code></pre>"
				)
			} catch (__) { }
		}
		return (
			'<pre><code class="hljs">' +
			md.utils.escapeHtml(str) +
			"</code></pre>"
		)
	},
})

function replacePlaceholder(shell: string, page: string) {
	const shellHtml = html.parse(shell)
	const placeholderTag = shellHtml.querySelector('build[placeholder]')!
	if (!placeholderTag) return shell
	const original = shell.slice(...placeholderTag.range)
	shell = shell.replace(original, page)
	return shell
}

async function render(page: string) {
	const pageHtml = html.parse(page)
	const buildTags = pageHtml.querySelectorAll('build[src]')
	const replacements = buildTags.map(buildTag => {
		const original = page.slice(...buildTag.range)
		const src = buildTag.getAttribute('src')!
		return { original, src }
	})

	for (const rep of replacements) {
		let replaceWith = await fs.readFile(rep.src, 'utf-8')
		page = page.replace(rep.original, replaceWith)
	}

	return page
}

async function readFile(path: string) {
	let content = await fs.readFile(path).then((buffer) => buffer.toString())
	if (path.endsWith('.md')) {
		content = md.render(content)
	}
	return content
}

if (argv['watch']) {
	const inputs = ['./src', '../starter/dist-web/*.mjs', './dev/empty.js']
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
