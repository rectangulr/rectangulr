import * as _ from '@s-libs/micro-dash'
import chokidar from 'chokidar'
import hljs from 'highlight.js'
import markdown from 'markdown-it'
import * as parser from 'node-html-parser'
import { $, argv, fs } from 'zx'
import esbuild from 'esbuild'
import { assert } from 'console'

$.verbose = true

async function main() {
	fs.access('../starter/dist-web')

	previewId = 0

	await $`mkdir -p dist`.catch(() => { })

	// Copy website files
	await $`cp ./src/style.css dist/`
	await $`cp -r ./src/images dist/`
	await $`cp src/pages/playground/placeholder.ts dist/`
	await $`cp dev/empty.js dist/`

	// Generate pages
	let shell: Html = await readFile('./src/shell.html')
	shell = await build(shell)

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
			console.log(`  ${newFilePath}`)

			let pageContent = await readFile(fullPath)
			let page = await build(pageContent)
			if (shouldWrap) {
				page = await replacePlaceholder(shell, page)
			}
			await fs.writeFile(`dist/${newFilePath}`, page)
		}
	}

	// Copy example app
	await $`rm -r dist/starter`.catch(() => { })
	await $`cp -r ../starter/dist-web dist/starter`.catch(() => { })
	// await $`npx rg -i ../rectangulr/dist/fesm2022/rectangulr-rectangulr.mjs -o dist --watch=false`
	const opts: esbuild.BuildOptions = {
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
					COLORTERM: 'truecolor',
				}
			}, null, 2)
		},
	}
	await esbuild.build({
		...opts,
		entryPoints: ['node_modules/@rectangulr/rectangulr/fesm2022/rectangulr-rectangulr.mjs'],
		outfile: 'dist/rectangulr.mjs',
	})
	await esbuild.build({
		...opts,
		entryPoints: ['./src/xterm.ts'],
		outfile: 'dist/xterm.mjs',
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
	const shellHtml = parser.parse(shell)
	const placeholderTag = shellHtml.querySelector('build[placeholder]')!
	if (!placeholderTag) return shell
	const original = shell.slice(...placeholderTag.range)
	shell = shell.replace(original, page)
	return shell
}

async function build(page: Html, depth = 0): Promise<Html> {
	assert(depth < 20, 'Recursion depth exceeded in render function')
	page = await processBuildSrcTags(page, depth)
	page = await processPreviewTags(page)
	return page
}

async function processBuildSrcTags(page: Html, depth): Promise<Html> {
	const pageHtml = parser.parse(page)
	const buildTags = pageHtml.querySelectorAll('build[src]')
	const replacements = buildTags.map(buildTag => {
		const original = page.slice(...buildTag.range)
		const src = buildTag.getAttribute('src')!
		return { original, src }
	})

	for (const rep of replacements) {
		let replaceWith = await readFile(rep.src)
		replaceWith = await build(replaceWith, depth + 1)
		page = page.replace(rep.original, replaceWith)
	}

	return page
}

let previewId = 0

async function processPreviewTags(page: Html): Promise<Html> {
	const pageHtml = parser.parse(page)
	const previewTags = pageHtml.querySelectorAll('preview[src]')
	const replacements = previewTags.map(previewTag => {
		const original = page.slice(...previewTag.range)
		const src = previewTag.getAttribute('src')!
		return { original, src }
	})

	for (const rep of replacements) {
		await $`rg --watch=false -i ${rep.src} -o dist/examples --customEsbuild "{external: ['@angular/core', '@rectangulr/rectangulr', '@angular/compiler']}" --target=web`
		const outputFile = `examples/${rep.src.split('/').pop()!.replace('.ts', '.mjs')}`
		const id = `preview-${previewId++}`
		const code = await fs.readFile(rep.src, 'utf-8')
		const highlighted = hljs.highlightAuto(code).value
		const replaceWith = html`
			<div style="display: flex; flex-direction: row; gap: 16px; align-items: flex-start;">
				<div style="flex: 2 1 0">
					<pre style="margin:0; padding:0; color:#eee">
						<code class="hljs">${highlighted}</code>
					</pre>
				</div>
				<div style="flex: 1 1 0">
					<div id="${id}" style="height: 300px"></div>
				</div>
			</div>
			<script type="module">
				import main from './${outputFile}'
				import { bootstrapApplication, provideXtermJs } from '@rectangulr/rectangulr'

				const xterm = createTerminal('#${id}')
				if (main.toString().startsWith('class')) {
					bootstrapApplication(main, {
						providers: [
							provideXtermJs(xterm)
						]
					}).catch((err) => console.error(err))
				} else {
					main(xterm)
				}
			</script>
		`
		page = page.replace(rep.original, replaceWith)
	}

	return page
}

const html = String.raw

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
		$`npx live-server dist --no-browser`
	}
	console.log(`Watching ${inputs.join(', ')}`)
} else {
	main()
}
