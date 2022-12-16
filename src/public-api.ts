/*
 * Public API Surface of Rectangulr
 */

import 'zone.js/dist/zone-node.js'

// Basics
export { Box } from './components/1-basics/box'
export { TextInput } from './components/1-basics/input'
export { StyleDirective, StylesDirective } from './components/1-basics/style'
export { ClassesDirective, NativeClassesDirective } from './components/1-basics/classes'

// Common
export { OnEnterDirective } from './components/2-common/list/list_on_enter'
export { List, BasicObjectDisplay } from './components/2-common/list/list'
export { ListItem } from './components/2-common/list/list_item'
export { SearchList } from './components/2-common/search_list'
export { ObjectDisplay } from './components/2-common/object_display'
export { Row } from './components/2-common/table/row.component'
export { Table } from './components/2-common/table/table.component'
export { ObjectEditor, KeyValueEditor } from './components/2-common/object_editor'
export { FocusIfDirective, FocusDirective } from './commands/focus'

export { ViewService, View } from './components/2-common/appShell/view.service'
export { AppShell } from './components/2-common/appShell/app-shell.component'
export { ConfigLoader } from './components/2-common/config_loader'
export { ComponentOutletInputs } from './utils/componentOutletInput'

export { ShortcutsDisplay } from './commands/commands.component'
export { Command, ShortcutService, registerShortcuts } from './commands/shortcut.service'
export { DetachedCommandServiceDirective } from './commands/commands_detach'
export {
  INJECT_NOTIFICATIONS_SERVICE,
  NotificationsService,
} from './components/2-common/appShell/notifications.service'
export { Notifications } from './components/2-common/appShell/notifications.component'
export { Json5Pipe } from './components/2-common/json5.pipe'
export { Logs } from './components/2-common/appShell/logs.component'

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
