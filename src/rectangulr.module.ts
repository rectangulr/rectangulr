import { APP_INITIALIZER, ErrorHandler, NgModule, RendererFactory2 } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { DynamicModule } from 'ng-dynamic-component'
import { RectangulrRendererFactory } from './angular-terminal/angular-dom'
import { RectangulrErrorHandler } from './angular-terminal/error-handler'
import { Screen } from './angular-terminal/screen-service'
import { CommandsDisplay } from './commands/commands.component'
import { DetachedCommandServiceDirective } from './commands/commands_detach'
import { FocusDirective, FocusSeparateDirective } from './commands/focus'
import { Box } from './components/1-basics/box'
import { ClassesDirective, NativeClassesDirective } from './components/1-basics/classes'
import { TextInput } from './components/1-basics/input'
import { StyleDirective, StylesDirective } from './components/1-basics/style'
import { AppShell } from './components/2-common/appShell/app-shell.component'
import { Notifications } from './components/2-common/appShell/notifications.component'
import { Json5Pipe } from './components/2-common/json5.pipe'
import { BasicObjectDisplay, List } from './components/2-common/list/list'
import { ListItem } from './components/2-common/list/list_item'
import { OnEnterDirective } from './components/2-common/list/list_on_enter'
import { ObjectDisplay } from './components/2-common/object_display'
import { KeyValueEditor, ObjectEditor } from './components/2-common/object_editor'
import { SearchList } from './components/2-common/search_list'
import { Row } from './components/2-common/table/row.component'
import { Table } from './components/2-common/table/table.component'
import { ComponentOutletInputs } from './utils/componentOutletInput'

const exports = [
  Box,
  List,
  ListItem,
  SearchList,
  OnEnterDirective,
  TextInput,
  ObjectDisplay,
  ObjectEditor,
  BasicObjectDisplay,
  Table,
  Row,
  StyleDirective,
  StylesDirective,
  ClassesDirective,
  NativeClassesDirective,
  FocusDirective,
  FocusSeparateDirective,
  DetachedCommandServiceDirective,
  KeyValueEditor,
  SearchList,
  CommandsDisplay,
  AppShell,
  Notifications,
  Json5Pipe,
  ComponentOutletInputs,
]

@NgModule({
  imports: [BrowserModule, ReactiveFormsModule, DynamicModule],
  declarations: exports,
  exports: [...exports, BrowserModule, ReactiveFormsModule, DynamicModule],
  providers: [
    Screen,
    { provide: RendererFactory2, useClass: RectangulrRendererFactory },
    { provide: ErrorHandler, useClass: RectangulrErrorHandler },
    {
      // used by ./lib/reactivity.ts -> forceRefresh()
      provide: APP_INITIALIZER,
      useValue: () => {
        // @ts-ignore
        globalThis['angularZone'] = Zone.current
        // @ts-ignore
        globalThis['rootZone'] = Zone.current.parent
      },
      multi: true,
    },
  ],
})
export class RectangulrModule {}
