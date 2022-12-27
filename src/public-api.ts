/*
 * Public API Surface of Rectangulr
 */

import 'zone.js/dist/zone-node.js'

// Basics
export { Box } from './components/1-basics/box'
export { TextInput } from './components/1-basics/text-input'
export { StyleDirective, StylesDirective } from './components/1-basics/style'
export { ClassesDirective, NativeClassesDirective } from './components/1-basics/classes'

// Common
export { OnEnterDirective } from './components/2-common/list/list-on-enter'
export { List, BasicObjectDisplay } from './components/2-common/list/list'
export { ListItem } from './components/2-common/list/list-item'
export { SearchList } from './components/2-common/search-list'
export { ObjectDisplay } from './components/2-common/object-display'
export { Row } from './components/2-common/table/row.component'
export { Table } from './components/2-common/table/table.component'
export { FormEditor, KeyValueEditor } from './components/2-common/form-editor'
export { JsonEditor } from './components/2-common/json-editor/json-editor'
export { FocusDirective } from './commands/focus'

export { ViewService, View } from './components/2-common/app-shell/view.service'
export { AppShell } from './components/2-common/app-shell/app-shell.component'
export { ConfigLoader } from './components/2-common/config-loader'
export { ComponentOutletInputs } from './utils/componentOutletInput'

export { ShortcutsDisplay } from './commands/commands.component'
export { Command, ShortcutService, registerShortcuts } from './commands/shortcut.service'
export { DetachedCommandServiceDirective } from './commands/commands-detach'
export {
  INJECT_NOTIFICATIONS_SERVICE,
  NotificationsService,
} from './components/2-common/app-shell/notifications.service'
export { Notifications } from './components/2-common/app-shell/notifications.component'
export { Json5Pipe } from './components/2-common/json5.pipe'
export { Logs } from './components/2-common/app-shell/logs.component'

// Lib
export {
  State,
  forceRefresh,
  subscribe,
  onChange,
  makeObservable,
  makeProperty,
} from './utils/reactivity'

// Platform
export { platform } from './angular-terminal/platform'
export { RectangulrModule } from './rectangulr.module'
export { Logger } from './angular-terminal/logger'
export { makeRuleset, Element, Event } from './angular-terminal/dom-terminal/'
