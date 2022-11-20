import { APP_INITIALIZER, ErrorHandler, NgModule, RendererFactory2 } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { ObjectDisplay } from '../components/2-common/object_display'
import { KeyValueEditor, ObjectEditor } from '../components/2-common/object_editor'
import { SearchList } from '../components/2-common/search_list'
import { AppShell } from '../components/2-common/viewService/app-shell.component'
import { CommandsDisplay } from '../commands/commands.component'
import { FocusDirective, FocusSeparateDirective } from '../commands/focus'
import { ClassesDirective, NativeClassesDirective } from '../components/1-basics/classes'
import { StyleDirective, StylesDirective } from '../components/1-basics/style'
import { TextInput } from '../components/1-basics/input'
import { BasicObjectDisplay, List } from '../components/2-common/list/list'
import { Row } from '../components/2-common/table/row.component'
import { ListItem } from '../components/2-common/list/list_item'
import { OnEnterDirective } from '../components/2-common/list/list_on_enter'
import { TerminalErrorHandler } from './error-handler'
import { TerminalRendererFactory } from './angular-dom'
import { Screen } from './screen-service'
import { Box } from '../components/1-basics/box'
import { ComponentOutletInputs } from '../utils/componentOutletInput'
import { DynamicModule } from 'ng-dynamic-component'
import { DetachedCommandServiceDirective } from '../commands/commands_detach'
import { Table } from '../components/2-common/table/table.component'

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
  ComponentOutletInputs,
]

@NgModule({
  imports: [BrowserModule, ReactiveFormsModule, DynamicModule],
  declarations: exports,
  exports: [...exports, BrowserModule, ReactiveFormsModule, DynamicModule],
  providers: [
    Screen,
    { provide: RendererFactory2, useClass: TerminalRendererFactory },
    { provide: ErrorHandler, useClass: TerminalErrorHandler },
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
