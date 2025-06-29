/*
 * Public API Surface of Rectangulr
 */

// Basics
export { TermElement, Event, TermScreen } from './angular-terminal/dom-terminal/'
export { LOGGER, Logger } from './angular-terminal/logger'

// Platform
export { platformRectangulr, bootstrapApplication } from './angular-terminal/platform'

export { DetachedCommandServiceDirective } from './commands/commands-detach'
export { CommandPicker } from './commands/command-picker.component'
export { FocusDirective } from './commands/focus.directive'
export { Command, registerShortcuts, ShortcutService } from './commands/shortcut.service'
export { H } from './components/1-basics/h'
export { V } from './components/1-basics/v'
export { HGrow } from './components/1-basics/hgrow.directive'
export { VGrow } from './components/1-basics/vgrow.directive'
export { Grow } from './components/1-basics/grow.directive'
export { Style } from './components/1-basics/Style.directive'
export { TAGS, Tags } from './logs/Tags'
export type { StyleValue } from './angular-terminal/dom-terminal/style/StyleHandler'
export { cond, eq, neq, addStyle } from './angular-terminal/dom-terminal/style/StyleHandler'
export { TextInput } from './components/1-basics/text-input'
export { AppShell } from './components/2-common/app-shell/app-shell.component'
export { Logs } from './components/2-common/app-shell/logs.component'
export { DomLog } from './logs/DomLog.directive'
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
export { Scroll } from './components/2-common/scroll.directive'
export { ValueDirective } from './components/2-common/value.directive'
export { SignalDirective } from './components/2-common/signal.directive'
export { ObjectDisplay } from './components/2-common/object-display'
export { SearchList } from './components/2-common/search-list'
export { Table, Row } from './components/2-common/table/table.component'
export { RectangulrModule } from './rectangulr.module'
export { ComponentOutletInputs } from './utils/componentOutletInput'
export { KeyValue } from './utils/interfaces'
export { StorageService } from './components/2-common/storage.service'
export { LogPointService } from './logs/LogPointService'

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
export { Ref, viewRef } from './ref.directive'

export * as globals from './globals'

// PRIVATE
export { INTERNAL_RECTANGULR_PLATFORM_PROVIDERS as ɵINTERNAL_RECTANGULR_PLATFORM_PROVIDERS } from './angular-terminal/platform'
export { Node as ɵNode } from './angular-terminal/dom-terminal'
export { VOID_TERMINAL_SIZE as ɵVOID_TERMINAL_SIZE } from './angular-terminal/terminals/VoidTerminal'
export { RECTANGULR_MODULE_PROVIDERS as ɵRECTANGULR_MODULE_PROVIDERS } from './rectangulr-module-providers'
export { TERMINAL as ɵTERMINAL } from './angular-terminal/terminals/Terminal'
export { VoidTerminal as ɵvoidTerminal } from './angular-terminal/terminals/VoidTerminal'
export { signal2 as ɵsignal2, computed2 as ɵcomputed2 } from './utils/Signal2'