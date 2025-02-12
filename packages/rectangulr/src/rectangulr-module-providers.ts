import { APP_INITIALIZER, EnvironmentProviders, ErrorHandler, inject, InjectionToken, Injector, provideExperimentalZonelessChangeDetection, Provider, RendererFactory2, ɵINJECTOR_SCOPE } from "@angular/core"
import { global_rgComponent, global_rgLView } from "./angular-terminal/debug"
import { debugYoga } from "./angular-terminal/debug-yoga"
import { RectangulrErrorHandler } from "./angular-terminal/error-handler"
import { global_logs, patchNodeConsole, REDIRECT_CONSOLE_LOG } from "./angular-terminal/logger"
import { RectangulrRendererFactory2 } from "./angular-terminal/renderer"
import { ScreenService } from "./angular-terminal/screen-service"
import { ProcessTerminal } from "./angular-terminal/terminals/ProcessTerminal"
import { TERMINAL } from "./angular-terminal/terminals/Terminal"
import { addToGlobalRg } from './utils/addToGlobalRg'
import { InjectFunction } from "./utils/utils"


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
	{ provide: TERMINAL, useFactory: () => { return new ProcessTerminal(process) } },
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

				if (RECTANGULR_TARGET == 'node' && injector.get(REDIRECT_CONSOLE_LOG)) {
					patchNodeConsole(globalInject)
				}
			}
		},
		multi: true,
	},
]