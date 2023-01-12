/*
 * Public API Surface of Rectangulr
 */

// Basics
export { Element, Event, makeRuleset, TermScreen } from './angular-terminal/dom-terminal/'
export { Logger } from './angular-terminal/logger'

// Platform
export { platformRectangulr } from './angular-terminal/platform'
export {
  platformRectangulrDynamicTesting,
  RectangulrTestingModule,
} from './angular-terminal/platform-testing'
export { DetachedCommandServiceDirective } from './commands/commands-detach'
export { ShortcutsDisplay } from './commands/commands.component'
export { FocusDirective } from './commands/focus'
export { Command, registerShortcuts, ShortcutService } from './commands/shortcut.service'
export { Box } from './components/1-basics/box'
export { ClassesDirective, NativeClassesDirective } from './components/1-basics/classes'
export { StyleDirective, StylesDirective } from './components/1-basics/style'
export { TextInput } from './components/1-basics/text-input'
export { AppShell } from './components/2-common/app-shell/app-shell.component'
export { Logs } from './components/2-common/app-shell/logs.component'
export { Notifications } from './components/2-common/app-shell/notifications.component'
export {
  INJECT_NOTIFICATIONS_SERVICE,
  NotificationsService,
} from './components/2-common/app-shell/notifications.service'
export { View, ViewService } from './components/2-common/app-shell/view.service'
export { ConfigLoader } from './components/2-common/config-loader'
export { FormEditor, KeyValueEditor } from './components/2-common/form-editor'
export { JsonEditor } from './components/2-common/json-editor/json-editor'
export { Json5Pipe } from './components/2-common/json5.pipe'
export { BasicObjectDisplay, List } from './components/2-common/list/list'
export { ListItem } from './components/2-common/list/list-item'

// Common
export { OnEnterDirective } from './components/2-common/list/list-on-enter'
export { ObjectDisplay } from './components/2-common/object-display'
export { SearchList } from './components/2-common/search-list'
export { Row } from './components/2-common/table/row.component'
export { Table } from './components/2-common/table/table.component'
export { RectangulrModule } from './rectangulr.module'
export { ComponentOutletInputs } from './utils/componentOutletInput'
export { KeyValue } from './utils/interfaces'

// Utils
export {
  forceRefresh,
  makeObservable,
  makeProperty,
  onChange,
  State,
  subscribe,
} from './utils/reactivity'
