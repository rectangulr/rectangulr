import { APP_INITIALIZER, ErrorHandler, InjectionToken, Injector, RendererFactory2, inject, ɵINJECTOR_SCOPE } from "@angular/core"
import { RectangulrRendererFactory2 } from "./angular-terminal/angular-dom"
import { global_rgComponent, global_rgLView } from "./angular-terminal/debug"
import { RectangulrErrorHandler } from "./angular-terminal/error-handler"
import { INPUT_OUTPUT, StdinStdout } from "./angular-terminal/input-output"
import { global_logs, patchGlobalConsole } from "./angular-terminal/logger"
import { ScreenService } from "./angular-terminal/screen-service"
import { InjectFunction, addToGlobalRg } from "./utils/utils"
import { debugYoga } from "./angular-terminal/debug-yoga"


// @ts-ignore
export const NG_DEV_MODE = typeof ngDevMode === 'undefined' || !!ngDevMode

export const RECTANGULR_MODULE_PROVIDERS_MARKER = new InjectionToken(
	NG_DEV_MODE ? 'RectangulrModule Providers Marker' : ''
)


export const RECTANGULR_MODULE_PROVIDERS = [
	{ provide: ɵINJECTOR_SCOPE, useValue: 'root' },
	{ provide: ErrorHandler, useClass: RectangulrErrorHandler },
	{ provide: RendererFactory2, useClass: RectangulrRendererFactory2 },
	NG_DEV_MODE ? { provide: RECTANGULR_MODULE_PROVIDERS_MARKER, useValue: true } : [],
	{ provide: 'global', useValue: globalThis },
	{ provide: ScreenService, useClass: ScreenService },
	{ provide: INPUT_OUTPUT, useValue: StdinStdout },
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

				if (!('TEST' in globalThis)) {
					patchGlobalConsole(globalInject)
				}
			}
		},
		multi: true,
	},
]