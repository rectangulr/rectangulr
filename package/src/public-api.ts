/*
 * Public API Surface of Rectangulr
 */

import 'zone.js/dist/zone-node'

// Basics
export { Box } from './components/1-basics/box'
export { TuiInput } from './components/1-basics/input'
export { StyleDirective, StylesDirective } from './components/1-basics/style'
export { ClassesDirective, NativeClassesDirective } from './components/1-basics/classes'

// Common
export { OnEnterDirective } from './components/2-common/list/list_on_enter'
export {
  List,
  BasicObjectDisplay,
  TableObjectDisplay,
} from './components/2-common/list/list'
export { ListItem } from './components/2-common/list/list_item'
export { SearchList } from './components/2-common/search_list'
export { ObjectDisplay } from './components/2-common/object_display'
export { ObjectEditor, KeyValueEditor } from './components/2-common/object_editor'
export { CommandsDisplay } from './commands/commands'
export { FocusDirective, FocusSeparateDirective } from './commands/focus'
export { ViewSwitcherService, View } from './components/2-common/views/view_switcher.service'
export { ViewSwitcher } from './components/2-common/views/view_switcher.component'
export { Command, CommandService, registerCommands } from './commands/command-service'
export { ConfigLoader } from './components/2-common/config_loader'

// Lib
export { State, forceRefresh, onChange, onChangeEmit } from './lib/reactivity'

// Platform
export { platformTerminal } from './angular-terminal/platform'
export { TerminalModule } from './angular-terminal/rectangulr.module'
export { Logger } from './angular-terminal/logger'
export { makeRuleset, Element, Event } from './angular-terminal/dom-terminal'
