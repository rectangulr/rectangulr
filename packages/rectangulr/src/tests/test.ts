const Jasmine = require('jasmine')
const jasmineCore = require('jasmine-core/lib/jasmine-core/jasmine.js')
jasmineCore.boot = require('jasmine-core/lib/jasmine-core/node_boot.js')
const j = new Jasmine({
  jasmineCore: jasmineCore,
})
import { $ } from 'zx'
$.verbose = true

require('zone.js') // to have Promise[__symbol('uncaughtPromiseError')]
require('zone.js/node')
require('zone.js/plugins/zone-testing')

const { getTestBed } = require('@angular/core/testing')
require('../globals') // to initialize RECTANGULR_TARGET = 'node'
const { platformRectangulrDynamicTesting, RectangulrDynamicTestingModule } = require('./testing/index')

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  RectangulrDynamicTestingModule,
  platformRectangulrDynamicTesting(),
  { teardown: { destroyAfterEach: true }, errorOnUnknownProperties: true }
)

// To fix 'Error: Unknown macroTask scheduled in fake async test: fs.open'
beforeEach(() => {
  globalThis['__zone_symbol__FakeAsyncTestMacroTask'] = [{
    source: 'fs.writeFile',
    callbackArgs: []
  },
  {
    source: 'fs.open',
    callbackArgs: []
  }]
})

// empty error-snapshot directory
await $`rm src/tests/error-snapshots/*`.nothrow()

require('../commands/shortcut.service.spec')
require('../components/2-common/json-editor/json-editor.spec')
require('../components/2-common/list/list.spec')
require('../components/2-common/form-editor.spec')
require('../utils/derived.spec')

require('../angular-terminal/dom-terminal/layout/yoga.spec')
require('../angular-terminal/dom-terminal/dom/dom.spec')
require('../angular-terminal/dom-terminal/dom/dom2.spec')
require('../angular-terminal/dom-terminal/dom/dom3.spec')
require('../angular-terminal/dom-terminal/style/style.spec')
require('../angular-terminal/dom-terminal/paint/Frame.spec')

require('../logs/LogPointService.spec')
require('../tests/bug-text-input-resize.spec')
require('../tasks/tasks.spec')

j.execute()
