// Use require() to make sure webpack doesnt change the order of the imports
import Jasmine from 'jasmine'
const jasmine = new Jasmine()

require('zone.js/dist/zone-node.js')
require('zone.js/dist/zone-testing-node-bundle.js')

const { getTestBed } = require('@angular/core/testing')
const { platformRectangulrDynamicTesting } = require('./angular-terminal/testing/platform-testing')
const { RectangulrDynamicTestingModule } = require('./angular-terminal/testing/testing.module')

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  RectangulrDynamicTestingModule,
  platformRectangulrDynamicTesting(),
  { teardown: { destroyAfterEach: true } }
)

require('./commands/shortcut.service.spec')
require('./components/2-common/json-editor/json-editor.spec')
require('./components/2-common/list/list.spec')
require('./components/2-common/form-editor.spec')

require('./angular-terminal/dom-terminal/yoga.spec')
require('./angular-terminal/dom-terminal/dom.spec')

// require('./angular-terminal/dom-terminal/sources/core/dom/Node.spec')
// require('./angular-terminal/dom-terminal/sources/core/dom/Element.spec')

jasmine.execute()
