// Use require() to make sure webpack doesnt change the order of the imports
const Jasmine = require('jasmine')
// @ts-ignore
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

// Then we find all the tests.
const context = import.meta.webpackContext('./', { recursive: true, regExp: /\.spec\.ts$/ })
// And load the modules.
context.keys().map(context)

jasmine.execute()
