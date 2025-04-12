import { inject, InjectionToken } from '@angular/core'
import { Terminal } from './Terminal'


export const VOID_TERMINAL_SIZE = new InjectionToken('TERMINAL_SIZE', {
	providedIn: 'root',
	factory: () => ({ width: 150, height: 40 }),
})

export const VoidTerminal: Terminal = {
	name: 'VoidTerminal',
	inputs: {
		send: (input) => { },
		on: (event, func) => { },
		subscribe: func => ({ dispose: () => { } }),
	},
	screen: {
		write: text => true,
		size: () => (inject(VOID_TERMINAL_SIZE)),
		on: (event, func) => { },
	},
}
