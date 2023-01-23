import { CommonModule } from '@angular/common'
import {
  ApplicationModule,
  APP_INITIALIZER,
  ErrorHandler,
  Inject,
  inject,
  InjectionToken,
  Injector,
  NgModule,
  Optional,
  RendererFactory2,
  SkipSelf,
  ɵINJECTOR_SCOPE,
} from '@angular/core'
import { RectangulrRendererFactory } from './angular-terminal/angular-dom'
import { global_rgComponent, global_rgLView } from './angular-terminal/debug'
import { Node } from './angular-terminal/dom-terminal'
import { RectangulrErrorHandler } from './angular-terminal/error-handler'
import { INPUT_OUTPUT, StdinStdout } from './angular-terminal/input-output'
import { global_logs, patchGlobalConsole } from './angular-terminal/logger'
import { ScreenService } from './angular-terminal/screen-service'
import { DetachedCommandServiceDirective } from './commands/commands-detach'
import { Shortcuts } from './commands/shortcuts.component'
import { FocusDirective } from './commands/focus.directive'
import { Box } from './components/1-basics/box'
import { ClassesDirective, NativeClassesDirective } from './components/1-basics/classes'
import { StyleDirective, StylesDirective } from './components/1-basics/style'
import { TextInput } from './components/1-basics/text-input'
import { AppShell } from './components/2-common/app-shell/app-shell.component'
import { Logs } from './components/2-common/app-shell/logs.component'
import { Notifications } from './components/2-common/app-shell/notifications.component'
import { View } from './components/2-common/app-shell/view.service'
import { FormEditor, KeyValueEditor } from './components/2-common/form-editor'
import { JsonEditor } from './components/2-common/json-editor/json-editor'
import { Json5Pipe } from './components/2-common/json5.pipe'
import { BasicObjectDisplay, List } from './components/2-common/list/list'
import { ListItem } from './components/2-common/list/list-item'
import { OnEnterDirective } from './components/2-common/list/list-on-enter'
import { ObjectDisplay } from './components/2-common/object-display'
import { SearchList } from './components/2-common/search-list'
// import { Row } from './components/2-common/table/row.component'
import { Row, Table } from './components/2-common/table/table.component'
import { ComponentOutletInputs } from './utils/componentOutletInput'
import { addToGlobalRg, InjectFunction } from './utils/utils'

// @ts-ignore
const NG_DEV_MODE = typeof ngDevMode === 'undefined' || !!ngDevMode

const RECTANGULR_MODULE_PROVIDERS_MARKER = new InjectionToken(
  NG_DEV_MODE ? 'RectangulrModule Providers Marker' : ''
)

const TEMPLATE_COMPONENTS = [
  Box,
  List,
  ListItem,
  SearchList,
  OnEnterDirective,
  TextInput,
  ObjectDisplay,
  FormEditor,
  BasicObjectDisplay,
  Table,
  Row,
  StyleDirective,
  StylesDirective,
  ClassesDirective,
  NativeClassesDirective,
  FocusDirective,
  DetachedCommandServiceDirective,
  KeyValueEditor,
  Shortcuts,
  AppShell,
  Notifications,
  Json5Pipe,
  ComponentOutletInputs,
  Logs,
  JsonEditor,
]

export const RECTANGULR_MODULE_PROVIDERS = [
  { provide: ɵINJECTOR_SCOPE, useValue: 'root' },
  { provide: ErrorHandler, useClass: RectangulrErrorHandler },
  { provide: RendererFactory2, useClass: RectangulrRendererFactory },
  NG_DEV_MODE ? { provide: RECTANGULR_MODULE_PROVIDERS_MARKER, useValue: true } : [],
  { provide: View, useValue: { name: 'logs', component: Logs, tags: ['hidden'] }, multi: true },
  { provide: 'global', useValue: globalThis },
  { provide: ScreenService, useClass: ScreenService },
  { provide: INPUT_OUTPUT, useValue: StdinStdout },
  {
    provide: APP_INITIALIZER,
    useFactory: () => {
      const injector = inject(Injector)
      const globalInjector: InjectFunction = token => injector.get(token)

      return function () {
        // @ts-ignore
        globalThis['angularZone'] = Zone.current // used by ./lib/reactivity.ts -> forceRefresh()
        // @ts-ignore
        globalThis['rootZone'] = Zone.current.parent
        // @ts-ignore
        globalThis['Node'] = Node

        addToGlobalRg({
          lView: global_rgLView,
          component: global_rgComponent,
          logs: global_logs,
        })

        patchGlobalConsole(globalInjector)
      }
    },
    multi: true,
  },
]

@NgModule({
  providers: [...RECTANGULR_MODULE_PROVIDERS],
  exports: [CommonModule, ApplicationModule],
})
export class RectangulrModule {
  constructor(
    @Optional()
    @SkipSelf()
    @Inject(RECTANGULR_MODULE_PROVIDERS_MARKER)
    providersAlreadyPresent: boolean | null
  ) {
    if (NG_DEV_MODE && providersAlreadyPresent) {
      throw new Error(
        `Providers from the \`RectangulrModule\` have already been loaded. If you need access ` +
          `to common directives such as NgIf and NgFor, import the \`CommonModule\` instead.`
      )
    }
  }
}

// {
//   provide: EVENT_MANAGER_PLUGINS,
//   useClass: DomEventsPlugin,
//   multi: true,
//   deps: [DOCUMENT, NgZone, PLATFORM_ID],
// },
// { provide: EVENT_MANAGER_PLUGINS, useClass: KeyEventsPlugin, multi: true, deps: [DOCUMENT] },
// {
//   provide: DomRendererFactory2,
//   useClass: DomRendererFactory2,
//   deps: [EventManager, DomSharedStylesHost, APP_ID],
// },
// { provide: RendererFactory2, useExisting: DomRendererFactory2 },
// { provide: SharedStylesHost, useExisting: DomSharedStylesHost },
// { provide: DomSharedStylesHost, useClass: DomSharedStylesHost, deps: [DOCUMENT] },
// { provide: EventManager, useClass: EventManager, deps: [EVENT_MANAGER_PLUGINS, NgZone] },
// { provide: XhrFactory, useClass: RectangulrXhr, deps: [] },

// @NgModule({
//   imports: [ReactiveFormsModule, DynamicModule],
//   declarations: exports,
//   exports: [...exports, ReactiveFormsModule, DynamicModule],
//   providers: [
//     { provide: View, useValue: { name: 'logs', component: Logs, tags: ['hidden'] }, multi: true },
//     { provide: 'global', useValue: globalThis },
//     { provide: ScreenService, useClass: ScreenService },
//     { provide: RendererFactory2, useClass: RectangulrRendererFactory },
//     { provide: ErrorHandler, useClass: RectangulrErrorHandler },
//     { provide: INPUT_OUTPUT, useValue: StdinStdout },
//     {
//       provide: APP_INITIALIZER,
//       useFactory: () => {
//         const injector = inject(Injector)
//         const globalInjector: InjectFunction = token => injector.get(token)

//         return function () {
//           // @ts-ignore
//           globalThis['angularZone'] = Zone.current // used by ./lib/reactivity.ts -> forceRefresh()
//           // @ts-ignore
//           globalThis['rootZone'] = Zone.current.parent
//           // @ts-ignore
//           globalThis['Node'] = Node

//           addToGlobalRg({
//             lView: global_rgLView,
//             component: global_rgComponent,
//             logs: global_logs,
//           })

//           patchGlobalConsole(globalInjector)
//         }
//       },
//       multi: true,
//     },
//   ],
// })
// export class TestRectangulrModule {}
