import { ErrorHandler, NgModule, RendererFactory2 } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { DynamicModule } from 'ng-dynamic-component'
import { CommandsDisplay } from '../commands/commands'
import {
  BoxDirective,
  ClassesDirective,
  NativeClassesDirective,
  StyleDirective,
} from '../components/component'
import { TuiInput } from '../reusable/input'
import { BasicObjectDisplay, List } from '../reusable/list'
import { ObjectDisplay } from '../reusable/object-display'
import { KeyValueEditor, ObjectEditor } from '../reusable/object-editor'
import { SearchList } from '../reusable/search-list'
import { TerminalErrorHandler } from './error-handler'
import { TerminalRendererFactory } from './renderer'
import { Screen } from './screen-service'

const declarations = [
  BoxDirective,
  List,
  SearchList,
  TuiInput,
  ObjectDisplay,
  ObjectEditor,
  BasicObjectDisplay,
  StyleDirective,
  ClassesDirective,
  NativeClassesDirective,
  KeyValueEditor,
  SearchList,
  CommandsDisplay,
]

@NgModule({
  imports: [BrowserModule, DynamicModule, ReactiveFormsModule],
  declarations: declarations,
  exports: [...declarations, BrowserModule, DynamicModule, ReactiveFormsModule],
  providers: [
    Screen,
    { provide: RendererFactory2, useClass: TerminalRendererFactory, deps: [Screen] },
    { provide: ErrorHandler, useClass: TerminalErrorHandler },
  ],
})
export class TerminalModule {}
