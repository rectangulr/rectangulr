/*
 * Public API Surface of rectangulr
 */

export { platformTerminal } from './lib/platform'
export { TerminalModule } from './lib/terminal.module'

export {
  BoxDirective,
  StyleDirective,
  ClassesDirective,
  NativeClassesDirective,
} from './components/component'
export { OnEnterDirective } from './directives/on_enter'

export { TuiInput } from './reusable/input'
export { List, BasicObjectDisplay } from './reusable/list'
export { SearchList } from './reusable/search-list'
export { ObjectDisplay } from './reusable/object-display'
export { ObjectEditor, KeyValueEditor } from './reusable/object-editor'

export { CommandsDisplay } from './commands/commands'
export { ViewSwitcherService, View } from './views/view_switcher.service'
export { ViewSwitcher } from './views/view_switcher.component'

export { Command, CommandService, registerCommands } from './commands/command-service'

export { Logger } from './lib/logger'
export { State, forceRefresh, onChange, onChangeEmit } from './utils/reactivity'
export { makeRuleset, Element, Event } from './mylittledom'
export { ConfigLoader } from './config'
export { TerminalRendererFactory } from './lib/renderer'
