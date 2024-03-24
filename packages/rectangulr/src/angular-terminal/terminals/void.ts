import { Terminal } from './terminal'


export const voidTerminal: Terminal = {
	inputs: {
		send: (input) => { },
		on: (event, func) => { },
		subscribe: func => ({ dispose: () => { } }),
	},
	screen: {
		write: text => true,
		columns: 150,
		rows: 40,
		on: (event, func) => { },
	},
}
