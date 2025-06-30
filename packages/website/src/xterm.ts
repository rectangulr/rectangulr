import { Terminal } from 'xterm'
import { WebglAddon } from 'xterm-addon-webgl'
import { FitAddon } from 'xterm-addon-fit'

function createTerminal(selector: string) {
	const term = new Terminal({
		fontSize: 16,
		fontFamily: '"Menlo for Powerline", Menlo, Consolas, "Liberation Mono", Courier, monospace',
		theme: {
			foreground: '#d2d2d2',
			background: '#2b2b2b',
			cursor: '#adadad',
		},
	})
	term.loadAddon(new WebglAddon())
	const fitAddon = new FitAddon()
	term.loadAddon(fitAddon)
	const container = document.querySelector(selector)
	term.open(container as any)

	fitAddon.fit()
	const resizeObserver = new ResizeObserver(() => {
		fitAddon.fit()
	})
	resizeObserver.observe(document.querySelector('body')!)

	return term
}

// @ts-ignore
globalThis['createTerminal'] = createTerminal
