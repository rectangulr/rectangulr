const Jasmine = require('jasmine')
const jasmineCore = require('jasmine-core/lib/jasmine-core/jasmine.js')
jasmineCore.boot = require('jasmine-core/lib/jasmine-core/node_boot.js')
const j = new Jasmine({
  jasmineCore: jasmineCore,
})

import { getTestBed } from '@angular/core/testing'
import { RectangulrDynamicTestingModule, platformRectangulrDynamicTesting } from '@rectangulr/rectangulr/testing'

getTestBed().initTestEnvironment(
  RectangulrDynamicTestingModule,
  platformRectangulrDynamicTesting(),
  { teardown: { destroyAfterEach: true }, errorOnUnknownProperties: true }
)

require('./test')
require('./tests/tt')
require('./tests/tt2')

j.execute()

export function assert(value: any): asserts value {
  if (!value) {
    throw new Error('Assertion failed')
  }
}