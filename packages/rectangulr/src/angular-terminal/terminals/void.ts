import { Terminal } from './terminal'


export const voidTerminal: Terminal = {
	inputs: {
		send: (input) => { },
		on: (event, func) => { },
		subscribe: func => ({ dispose: () => { } }),
	},
	screen: {
		write: text => true,
		size: () => ({ width: 150, height: 40 }),
		on: (event, func) => { },
	},
}
