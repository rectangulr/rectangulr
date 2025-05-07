import * as _ from '@s-libs/micro-dash'
import chokidar from 'chokidar'
import { $, fs, argv } from 'zx'
import * as html from 'node-html-parser'
import markdown from 'markdown-it'
import hljs from 'highlight.js'
import esbuild from 'esbuild'

$.verbose = true

async function main() {
	fs.access('../starter/dist-web')
	fs.access('../rectangulr/dist')

	await $`mkdir -p ./dist`.catch(() => { })

	// Copy website files
	await $`cp ./src/style.css ./dist/`
	await $`cp ./src/website.js ./dist/`
	await $`cp -r ./src/images ./dist/`

	// Generate pages
	let shell: Html = await readFile('./src/shell.html')
	shell = await render(shell)

	for (let filePath of await fs.readdir('./src/pages')) {
		const fullPath = `./src/pages/${filePath}`
		const stat = await fs.stat(fullPath)
		if (stat.isFile()) {
			let pageContent = await readFile(fullPath)
			const page = await render(pageContent)
			const fullPage = await replacePlaceholder(shell, page)
			const newFilePath = filePath.replace(/\.md$/, '.html')
			await fs.writeFile(`./dist/${newFilePath}`, fullPage)
		}
	}

	// Copy example app
	await $`cp -r ../starter/dist-web ./dist/starter/`
	await esbuild.build({
		entryPoints: ['../rectangulr/dist/fesm2022/rectangulr-rectangulr.mjs'],
		outfile: 'dist/rectangulr.mjs',
		bundle: true,
		format: 'esm',
		external: ['@angular/core', '@angular/core/rxjs-interop'],
		platform: 'node',
		banner: {
			js: `globalThis.process = {env: {}}`
		}
	})

}

type Html = string
type Path = string

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

function replacePlaceholder(shell: string, page: Html): Html {
	const shellHtml = html.parse(shell)
	const placeholderTag = shellHtml.querySelector('build[placeholder]')!
	if (!placeholderTag) return shell
	const original = shell.slice(...placeholderTag.range)
	shell = shell.replace(original, page)
	return shell
}

async function render(page: Html): Promise<Html> {
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

async function readFile(path: Path): Promise<Html> {
	let content = await fs.readFile(path).then((buffer) => buffer.toString())
	if (path.endsWith('.md')) {
		content = md.render(content)
	}
	return content as Html
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
