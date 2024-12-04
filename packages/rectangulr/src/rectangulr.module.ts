import { CommonModule } from '@angular/common'
import {
  ApplicationModule,
  Inject,
  NgModule,
  Optional,
  SkipSelf
} from '@angular/core'
import { DetachedCommandServiceDirective } from './commands/commands-detach'
import { FocusDebugDirective, FocusDirective } from './commands/focus.directive'
import { Shortcuts } from './commands/shortcuts.component'
import { GrowDirective, HBox, HGrowDirective, VBox, VGrowDirective } from './components/1-basics/box'
import { StyleDirective, } from './components/1-basics/style'
import { TextInput } from './components/1-basics/text-input'
import { AppShell } from './components/2-common/app-shell/app-shell.component'
import { Logs } from './components/2-common/app-shell/logs.component'
import { Notifications } from './components/2-common/app-shell/notifications.component'
import { FormEditor } from './components/2-common/form-editor'
import { KeyValueEditor } from './components/2-common/KeyValueEditor'
import { JsonEditor } from './components/2-common/json-editor/json-editor'
import { Json5Pipe } from './components/2-common/json5.pipe'
import { BasicObjectDisplay } from './components/2-common/list/basic-object-display'
import { List } from './components/2-common/list/list'
import { ListItem } from './components/2-common/list/list-item'
import { ObjectDisplay } from './components/2-common/object-display'
import { OnEnterDirective } from './components/2-common/on-enter.directive'
import { SearchList } from './components/2-common/search-list'
import { SignalDirective } from './components/2-common/signal.directive'
import { Row, Table } from './components/2-common/table/table.component'
import { Tree } from './components/2-common/tree/tree'
import { TreeNode } from './components/2-common/tree/tree-node'
import { ValueDirective } from './components/2-common/value.directive'
import { NG_DEV_MODE, RECTANGULR_MODULE_PROVIDERS, RECTANGULR_MODULE_PROVIDERS_MARKER } from './rectangulr-module-providers'
import { ComponentOutletInputs } from './utils/componentOutletInput'

const TEMPLATE_COMPONENTS = [
  HBox,
  VBox,
  HGrowDirective,
  VGrowDirective,
  GrowDirective,
  List,
  ListItem,
  Tree,
  TreeNode,
  SearchList,
  OnEnterDirective,
  TextInput,
  ObjectDisplay,
  FormEditor,
  BasicObjectDisplay,
  Table,
  Row,
  StyleDirective,
  FocusDirective,
  FocusDebugDirective,
  DetachedCommandServiceDirective,
  KeyValueEditor,
  Shortcuts,
  AppShell,
  Notifications,
  Json5Pipe,
  ComponentOutletInputs,
  Logs,
  JsonEditor,
  ValueDirective,
  SignalDirective,
]



@NgModule({
  providers: [...RECTANGULR_MODULE_PROVIDERS],
  imports: [...TEMPLATE_COMPONENTS],
  exports: [CommonModule, ApplicationModule, ...TEMPLATE_COMPONENTS],
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
