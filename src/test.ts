import Jasmine from 'jasmine'
const jasmine = new Jasmine()

require('zone.js/dist/zone-node.js')
require('zone.js/dist/zone-testing-node-bundle.js')

import { getTestBed } from '@angular/core/testing'
import { platformRectangulrDynamicTesting } from './angular-terminal/testing/platform-testing'
import { RectangulrDynamicTestingModule } from './angular-terminal/testing/testing.module'

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  RectangulrDynamicTestingModule,
  platformRectangulrDynamicTesting(),
  { teardown: { destroyAfterEach: true } }
)

// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/)
// And load the modules.
context.keys().map(context)

jasmine.execute()
