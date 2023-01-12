const Jasmine = require('jasmine')
const jasmine = new Jasmine()

require('zone.js/dist/zone-node.js')
require('zone.js/dist/zone-testing-node-bundle.js')

import { getTestBed } from '@angular/core/testing'
import { platformRectangulr } from './angular-terminal/platform'
import { RectangulrTestingModule } from './angular-terminal/platform-testing'

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(RectangulrTestingModule, platformRectangulr(), {
  teardown: { destroyAfterEach: true },
})

// Then we find all the tests.
// @ts-ignore
const context = require.context('./', true, /\.spec\.ts$/)
// And load the modules.
context.keys().map(context)

jasmine.execute()
