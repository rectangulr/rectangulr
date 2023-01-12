import { DOCUMENT } from '@angular/common'
import {
  APP_INITIALIZER,
  COMPILER_OPTIONS,
  ErrorHandler,
  inject,
  Injector,
  NgModule,
  RendererFactory2,
  Sanitizer,
} from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { DynamicModule } from 'ng-dynamic-component'
import { RectangulrRendererFactory } from './angular-terminal/angular-dom'
import { global_rgComponent, global_rgLView } from './angular-terminal/debug'
import { Node } from './angular-terminal/dom-terminal'
import { RectangulrErrorHandler } from './angular-terminal/error-handler'
import { INPUT_OUTPUT, StdinStdout } from './angular-terminal/input-output'
import { global_logs, patchGlobalConsole } from './angular-terminal/logger'
import { TerminalSanitizer } from './angular-terminal/sanitizer'
import { ScreenService } from './angular-terminal/screen-service'
import { DetachedCommandServiceDirective } from './commands/commands-detach'
import { ShortcutsDisplay } from './commands/commands.component'
import { FocusDirective } from './commands/focus'
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
import { Row } from './components/2-common/table/row.component'
import { Table } from './components/2-common/table/table.component'
import { ComponentOutletInputs } from './utils/componentOutletInput'
import { addToGlobalRg, InjectFunction } from './utils/utils'

const exports = [
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
  ShortcutsDisplay,
  AppShell,
  Notifications,
  Json5Pipe,
  ComponentOutletInputs,
  Logs,
  JsonEditor,
]

@NgModule({
  imports: [BrowserModule, ReactiveFormsModule, DynamicModule],
  declarations: exports,
  exports: [...exports, BrowserModule, ReactiveFormsModule, DynamicModule],
  providers: [
    { provide: View, useValue: { name: 'logs', component: Logs, tags: ['hidden'] }, multi: true },
    { provide: 'global', useValue: globalThis },
    { provide: DOCUMENT, useValue: {} },
    { provide: Sanitizer, useClass: TerminalSanitizer, deps: [] },
    { provide: COMPILER_OPTIONS, useValue: [], multi: true },
    { provide: ScreenService, useClass: ScreenService },
    { provide: RendererFactory2, useClass: RectangulrRendererFactory },
    { provide: ErrorHandler, useClass: RectangulrErrorHandler },
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
  ],
})
export class RectangulrModule {}
