import { APP_INITIALIZER, ErrorHandler, NgModule, RendererFactory2 } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { DynamicModule } from 'ng-dynamic-component'
import { CommandsDisplay } from '../commands/commands'
import { FocusDirective, FocusSeparateDirective } from '../commands/focus'
import {
  BoxDirective,
  ClassesDirective,
  NativeClassesDirective,
  StyleDirective,
  StylesDirective,
} from '../components/component'
import { OnEnterDirective } from '../directives/on_enter'
import { TuiInput } from '../reusable/input'
import { BasicObjectDisplay, List, ListItem } from '../reusable/list'
import { ObjectDisplay } from '../reusable/object-display'
import { KeyValueEditor, ObjectEditor } from '../reusable/object-editor'
import { SearchList } from '../reusable/search-list'
import { ViewSwitcher } from '../views/view_switcher.component'
import { TerminalErrorHandler } from './error-handler'
import { TerminalRendererFactory } from './renderer'
import { Screen } from './screen-service'

const declarations = [
  BoxDirective,
  List,
  ListItem,
  SearchList,
  OnEnterDirective,
  TuiInput,
  ObjectDisplay,
  ObjectEditor,
  BasicObjectDisplay,
  StyleDirective,
  StylesDirective,
  ClassesDirective,
  NativeClassesDirective,
  FocusDirective,
  FocusSeparateDirective,
  KeyValueEditor,
  SearchList,
  CommandsDisplay,
  ViewSwitcher,
]

@NgModule({
  imports: [BrowserModule, DynamicModule, ReactiveFormsModule],
  declarations: declarations,
  exports: [...declarations, BrowserModule, DynamicModule, ReactiveFormsModule],
  providers: [
    Screen,
    { provide: RendererFactory2, useClass: TerminalRendererFactory },
    { provide: ErrorHandler, useClass: TerminalErrorHandler },
    {
      // used by ./utils/reactivity.ts -> forceRefresh()
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
export class TerminalModule {}
