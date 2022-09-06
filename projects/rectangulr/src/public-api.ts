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

export { TuiInput } from './reusable/input'
export { List, BasicObjectDisplay } from './reusable/list'
export { SearchList } from './reusable/search-list'
export { ObjectDisplay } from './reusable/object-display'
export { ObjectEditor, KeyValueEditor } from './reusable/object-editor'

export { CommandsDisplay } from './commands/commands'

export {
  Command,
  CommandService,
  registerCommands,
  globalKeyDebug,
} from './commands/command-service'

export { Logger } from './lib/logger'
export { State, forceRefresh, onChange, onChangeEmit } from './utils/reactivity'
export { makeRuleset, Element, Event } from './mylittledom'
export { RgConfig } from './config'
export { TerminalRendererFactory } from './lib/renderer'
