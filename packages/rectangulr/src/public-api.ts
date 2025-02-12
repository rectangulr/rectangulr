/*
 * Public API Surface of Rectangulr
 */

// Basics
export { Element, Event, TermScreen } from './angular-terminal/dom-terminal/'
export { LOGGER, Logger } from './angular-terminal/logger'

// Platform
export { platformRectangulr, bootstrapApplication } from './angular-terminal/platform'

export { DetachedCommandServiceDirective } from './commands/commands-detach'
export { CommandPicker as Shortcuts } from './commands/command-picker.component'
export { FocusDirective } from './commands/focus.directive'
export { Command, registerShortcuts, ShortcutService } from './commands/shortcut.service'
export { H } from './components/1-basics/h'
export { V } from './components/1-basics/v'
export { HGrowDirective } from './components/1-basics/hgrow.directive'
export { VGrowDirective } from './components/1-basics/vgrow.directive'
export { GrowDirective } from './components/1-basics/grow.directive'
export { Style as StyleDirective } from './components/1-basics/style'
export { TAGS, TagsDirective } from './logs/Tags'
export type { StyleValue } from './angular-terminal/dom-terminal/sources/core/dom/StyleHandler.ts'
export { cond, eq, neq, addStyle } from './angular-terminal/dom-terminal/sources/core/dom/StyleHandler'
export { TextInput } from './components/1-basics/text-input'
export { AppShell } from './components/2-common/app-shell/app-shell.component'
export { Logs } from './components/2-common/app-shell/logs.component'
export { DomLogDirective } from './logs/DomLog.directive'
export { Notifications } from './components/2-common/app-shell/notifications.component'
export {
  INJECT_NOTIFICATIONS_SERVICE,
  NotificationsService,
} from './components/2-common/app-shell/notifications.service'
export { View, ViewService, provideView } from './components/2-common/app-shell/view.service'
export { ConfigLoader } from './components/2-common/config-loader'
export { FormEditor } from './components/2-common/form-editor'
export { KeyValueEditor } from './components/2-common/KeyValueEditor'
export { JsonEditor } from './components/2-common/json-editor/json-editor'
export { Json5Pipe } from './components/2-common/json5.pipe'
export { List } from './components/2-common/list/list'
export { ListItem } from './components/2-common/list/list-item'
export { Tree } from './components/2-common/tree/tree'
export { TreeNode } from './components/2-common/tree/tree-node'
export { BasicObjectDisplay } from './components/2-common/list/basic-object-display'

// Common
export { OnEnterDirective } from './components/2-common/on-enter.directive'
export { ScrollDirective } from './components/2-common/scroll.directive'
export { ValueDirective } from './components/2-common/value.directive'
export { SignalDirective } from './components/2-common/signal.directive'
export { ObjectDisplay } from './components/2-common/object-display'
export { SearchList } from './components/2-common/search-list'
export { Table, Row } from './components/2-common/table/table.component'
export { RectangulrModule } from './rectangulr.module'
export { ComponentOutletInputs } from './utils/componentOutletInput'
export { KeyValue } from './utils/interfaces'
export { StorageService } from './components/2-common/storage.service'

export { Tasks } from './tasks/Tasks'
export { provideXtermJs } from './angular-terminal/terminals/XtermTerminal'

// Utils
export {
  forceRefresh,
  makeObservable,
  makeProperty,
  onChange,
  State,
  subscribe,
  makeSignal,
  propToSignal,
  derived,
  makeIntoSignal,
} from './utils/reactivity'
export { DataFormat, CheckReturn, Completion } from './utils/data-format'

export * as globals from './globals'

// PRIVATE
export { INTERNAL_RECTANGULR_PLATFORM_PROVIDERS as ɵINTERNAL_RECTANGULR_PLATFORM_PROVIDERS } from './angular-terminal/platform'
export { Node as ɵNode } from './angular-terminal/dom-terminal'
export { RECTANGULR_MODULE_PROVIDERS as ɵRECTANGULR_MODULE_PROVIDERS } from './rectangulr-module-providers'
export { TERMINAL as ɵTERMINAL } from './angular-terminal/terminals/Terminal'
export { VoidTerminal as ɵvoidTerminal } from './angular-terminal/terminals/VoidTerminal'
export { signal2 as ɵsignal2, computed2 as ɵcomputed2 } from './utils/Signal2'