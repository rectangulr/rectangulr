import { inject, InjectionToken } from '@angular/core'
import { Terminal } from './terminal'


export const TERMINAL_SIZE = new InjectionToken('TERMINAL_SIZE', {
	providedIn: 'root',
	factory: () => ({ width: 150, height: 40 }),
})

export const voidTerminal: Terminal = {
	inputs: {
		send: (input) => { },
		on: (event, func) => { },
		subscribe: func => ({ dispose: () => { } }),
	},
	screen: {
		write: text => true,
		size: () => (inject(TERMINAL_SIZE)),
		on: (event, func) => { },
	},
}
