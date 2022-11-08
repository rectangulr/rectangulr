/*
 * Public API Surface of Rectangulr
 */

import 'zone.js/dist/zone-node.js'

// Basics
export { Box } from './components/1-basics/box'
export { TuiInput } from './components/1-basics/input'
export { StyleDirective, StylesDirective } from './components/1-basics/style'
export { ClassesDirective, NativeClassesDirective } from './components/1-basics/classes'

// Common
export { OnEnterDirective } from './components/2-common/list/list_on_enter'
export { List, BasicObjectDisplay, TableObjectDisplay } from './components/2-common/list/list'
export { ListItem } from './components/2-common/list/list_item'
export { SearchList } from './components/2-common/search_list'
export { ObjectDisplay } from './components/2-common/object_display'
export { ObjectEditor, KeyValueEditor } from './components/2-common/object_editor'
export { CommandsDisplay } from './commands/commands'
export { FocusDirective, FocusSeparateDirective } from './commands/focus'
export { ViewService, View } from './components/2-common/viewService/view.service'
export { ViewServiceComponent } from './components/2-common/viewService/view_service.component'
export { Command, CommandService, registerCommands } from './commands/command-service'
export { ConfigLoader } from './components/2-common/config_loader'
export { ComponentOutletInputs } from './utils/componentOutletInput'
// Lib
export { State, forceRefresh, onChange, makeObservable } from './utils/reactivity'

// Platform
export { platform } from './angular-terminal/platform'
export { RectangulrModule } from './angular-terminal/rectangulr.module'
export { Logger } from './angular-terminal/logger'
export { makeRuleset, Element, Event } from './angular-terminal/dom-terminal/'