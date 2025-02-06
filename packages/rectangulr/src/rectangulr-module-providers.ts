import { APP_INITIALIZER, ErrorHandler, InjectionToken, Injector, Provider, RendererFactory2, inject, ɵINJECTOR_SCOPE, provideExperimentalZonelessChangeDetection, EnvironmentProviders } from "@angular/core"
import { global_rgComponent, global_rgLView } from "./angular-terminal/debug"
import { debugYoga } from "./angular-terminal/debug-yoga"
import { RectangulrErrorHandler } from "./angular-terminal/error-handler"
import { global_logs, patchNodeConsole } from "./angular-terminal/logger"
import { RectangulrRendererFactory2 } from "./angular-terminal/renderer"
import { ScreenService } from "./angular-terminal/screen-service"
import { ProcessTerminal } from "./angular-terminal/terminals/processTerminal"
import { TERMINAL } from "./angular-terminal/terminals/terminal"
import { VoidTerminal } from './angular-terminal/terminals/void'
import { XTermTerminal } from "./angular-terminal/terminals/xtermTerminal"
import { addToGlobalRg } from './utils/addToGlobalRg'
import { InjectFunction, assert } from "./utils/utils"


// @ts-ignore
export const NG_DEV_MODE = typeof ngDevMode === 'undefined' || !!ngDevMode

export const RECTANGULR_MODULE_PROVIDERS_MARKER = new InjectionToken(
	NG_DEV_MODE ? 'RectangulrModule Providers Marker' : ''
)

export const RECTANGULR_MODULE_PROVIDERS: (Provider | EnvironmentProviders)[] = [
	provideExperimentalZonelessChangeDetection(),
	{ provide: ɵINJECTOR_SCOPE, useValue: 'root' },
	{ provide: ErrorHandler, useClass: RectangulrErrorHandler },
	{ provide: RendererFactory2, useClass: RectangulrRendererFactory2 },
	NG_DEV_MODE ? { provide: RECTANGULR_MODULE_PROVIDERS_MARKER, useValue: true } : [],
	{ provide: ScreenService, useClass: ScreenService },
	{
		provide: TERMINAL, useFactory: () => {
			if (RECTANGULR_TARGET == 'node') {
				return new ProcessTerminal(process)
			} else if (RECTANGULR_TARGET == 'web') {
				// TODO remove global var ?
				// implement rectangulr startup args
				const term = globalThis['xterm']
				assert(term, `RECTANGULR_TARGET == 'web', but no xterm was found on globalThis`)
				return new XTermTerminal(term)
			} else {
				return VoidTerminal
			}
		}
	},
	{
		provide: APP_INITIALIZER,
		useFactory: () => {
			const injector = inject(Injector)
			const globalInject: InjectFunction = token => injector.get(token)

			return function () {
				// @ts-ignore
				if (globalThis['Zone']) {
					// @ts-ignore
					globalThis['angularZone'] = Zone.current // used by ./lib/reactivity.ts -> forceRefresh()
					// @ts-ignore
					globalThis['rootZone'] = Zone.current.parent
				}

				addToGlobalRg({
					lView: global_rgLView,
					component: global_rgComponent,
					logs: global_logs,
					inject: globalInject,
					debugYoga: debugYoga,
				})

				if (RECTANGULR_TARGET == 'node' && !('TEST' in globalThis)) {
					patchNodeConsole(globalInject)
				}
			}
		},
		multi: true,
	},
]