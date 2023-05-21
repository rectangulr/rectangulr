/*
 * Public API Surface of Rectangulr
 */

// Basics
export { Element, Event, makeRuleset, TermScreen } from './angular-terminal/dom-terminal/'
export { Logger } from './angular-terminal/logger'

// Platform
export { platformRectangulr } from './angular-terminal/platform'
export { platformRectangulrDynamicTesting } from './angular-terminal/testing/platform-testing'
export { RectangulrDynamicTestingModule } from './angular-terminal/testing/testing.module'
export { DetachedCommandServiceDirective } from './commands/commands-detach'
export { Shortcuts as ShortcutsDisplay } from './commands/shortcuts.component'
export { FocusDirective, FocusDebugDirective } from './commands/focus.directive'
export { Command, registerShortcuts, ShortcutService } from './commands/shortcut.service'
export { HBox, VBox, HGrowDirective, VGrowDirective } from './components/1-basics/box'
export {
  NewClassesDirective as ClassesDirective,
  ClassesDirective as NativeClassesDirective,
} from './components/1-basics/classes'
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
export { JsonEditor, JsonPath } from './components/2-common/json-editor/json-editor'
export { Json5Pipe } from './components/2-common/json5.pipe'
export { List } from './components/2-common/list/list'
export { ListItem } from './components/2-common/list/list-item'
export { BasicObjectDisplay } from './components/2-common/list/basic-object-display'

// Common
export { OnEnterDirective } from './components/2-common/on-enter.directive'
export { ValueDirective } from './components/2-common/value.directive'
export { SignalDirective } from './components/2-common/signal.directive'
export { ObjectDisplay } from './components/2-common/object-display'
export { SearchList } from './components/2-common/search-list'
export { Table, Row } from './components/2-common/table/table.component'
export { RectangulrModule } from './rectangulr.module'
export { ComponentOutletInputs } from './utils/componentOutletInput'
export { KeyValue } from './utils/interfaces'
export * from './angular-terminal/signals/index'
export { StorageService } from './components/2-common/storage.service'

// Utils
export {
  forceRefresh,
  makeObservable,
  makeProperty,
  onChange,
  State,
  subscribe,
  makeSignal,
  derived,
} from './utils/reactivity'
export { DataFormat } from './utils/data-format'
