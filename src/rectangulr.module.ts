import {
  APP_INITIALIZER,
  ErrorHandler,
  inject,
  InjectionToken,
  Injector,
  NgModule,
  RendererFactory2,
} from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { DynamicModule } from 'ng-dynamic-component'
import { RectangulrRendererFactory } from './angular-terminal/angular-dom'
import { addGlobalRgDebug } from './angular-terminal/debug'
import { RectangulrErrorHandler } from './angular-terminal/error-handler'
import { exportGlobalLogs, patchGlobalConsole } from './angular-terminal/logger'
import { Screen } from './angular-terminal/screen-service'
import { ShortcutsDisplay } from './commands/commands.component'
import { DetachedCommandServiceDirective } from './commands/commands-detach'
import { FocusDirective } from './commands/focus'
import { Box } from './components/1-basics/box'
import { ClassesDirective, NativeClassesDirective } from './components/1-basics/classes'
import { TextInput } from './components/1-basics/text-input'
import { StyleDirective, StylesDirective } from './components/1-basics/style'
import { AppShell } from './components/2-common/app-shell/app-shell.component'
import { Logs } from './components/2-common/app-shell/logs.component'
import { Notifications } from './components/2-common/app-shell/notifications.component'
import { View } from './components/2-common/app-shell/view.service'
import { Json5Pipe } from './components/2-common/json5.pipe'
import { BasicObjectDisplay, List } from './components/2-common/list/list'
import { ListItem } from './components/2-common/list/list-item'
import { OnEnterDirective } from './components/2-common/list/list-on-enter'
import { ObjectDisplay } from './components/2-common/object-display'
import { KeyValueEditor, FormEditor } from './components/2-common/form-editor'
import { SearchList } from './components/2-common/search-list'
import { Row } from './components/2-common/table/row.component'
import { Table } from './components/2-common/table/table.component'
import { ComponentOutletInputs } from './utils/componentOutletInput'
import { addToGlobal, InjectFunction } from './utils/utils'
import { JsonEditor } from './components/2-common/json-editor/json-editor'

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
  // FocusFromChildrenDirective,
  DetachedCommandServiceDirective,
  KeyValueEditor,
  SearchList,
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
    Screen,
    { provide: RendererFactory2, useClass: RectangulrRendererFactory },
    { provide: ErrorHandler, useClass: RectangulrErrorHandler },
    { provide: View, useValue: { name: 'logs', component: Logs, tags: ['hidden'] }, multi: true },
    { provide: 'global', useValue: globalThis },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const injector = inject(Injector)
        const globalInjector: InjectFunction = token => injector.get(token)

        return function () {
          addToGlobal({
            inject: globalInjector,
          })

          // used by ./lib/reactivity.ts -> forceRefresh()
          // @ts-ignore
          globalThis['angularZone'] = Zone.current
          // @ts-ignore
          globalThis['rootZone'] = Zone.current.parent

          // TODO: addToGlobal only once
          exportGlobalLogs()
          patchGlobalConsole(globalInjector)
          addGlobalRgDebug()
        }
      },
      multi: true,
    },
  ],
})
export class RectangulrModule {}
