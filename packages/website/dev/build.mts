import * as _ from '@s-libs/micro-dash'
import chokidar from 'chokidar'
import hljs from 'highlight.js'
import markdown from 'markdown-it'
import * as html from 'node-html-parser'
import { $, argv, fs } from 'zx'
import esbuild from 'esbuild'

$.verbose = true

async function main() {
	fs.access('../starter/dist-web')
	fs.access('../rectangulr/dist')

	await $`mkdir -p dist`.catch(() => { })

	// Copy website files
	await $`cp ./src/style.css dist/`
	await $`cp -r ./src/images dist/`
	await $`cp src/pages/playground/placeholder.ts dist/`
	await $`cp dev/empty.js dist/`

	// Generate pages
	let shell: Html = await readFile('./src/shell.html')
	shell = await render(shell)

	const noWrap = [
		// 'playground.html'
	]

	console.log('Generating:')
	for (let filePath of await fs.readdir('./src/pages')) {
		const fullPath = `./src/pages/${filePath}`
		const stat = await fs.stat(fullPath)
		if (stat.isFile()) {
			const newFilePath = filePath.replace(/\.md$/, '.html')
			const shouldWrap = noWrap.filter(f => filePath.includes(f)).length == 0
			console.log(`  ${newFilePath} ` + (shouldWrap ? '' : '(no shell)'))

			let pageContent = await readFile(fullPath)
			let page = await render(pageContent)
			if (shouldWrap) {
				page = await replacePlaceholder(shell, page)
			}
			await fs.writeFile(`dist/${newFilePath}`, page)
		}
	}

	// Copy example app
	await $`rm -r dist/starter; cp -r ../starter/dist-web dist/starter`
	// await $`npx rg -i ../rectangulr/dist/fesm2022/rectangulr-rectangulr.mjs -o dist --watch=false`
	await esbuild.build({
		entryPoints: ['../rectangulr/dist/fesm2022/rectangulr-rectangulr.mjs'],
		outfile: 'dist/rectangulr.mjs',
		bundle: true,
		format: 'esm',
		external: ['@angular/core', '@angular/core/rxjs-interop'],
		platform: 'node',
		mainFields: ['module', 'browser', 'main'],
		treeShaking: true,
		define: {
			'RECTANGULR_TARGET': "'web'",
			'process': JSON.stringify({
				env: {
					TERM: 'xterm-256color',
				}
			}, null, 2)
		},
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
			} catch (e) { }
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
