import { NgIf } from '@angular/common'
import { Component, ViewChild } from '@angular/core'
import { fakeAsync } from '@angular/core/testing'
import { FocusDirective } from '../../../commands/focus.directive'
import { sendKeyAndDetectChanges, setupTest } from '../../../utils/tests'
import { Box } from '../../1-basics/box'
import { JsonEditor } from './json-editor'

@Component({
  standalone: true,
  imports: [Box, FocusDirective, NgIf, JsonEditor],
  template: ` <json-editor data="string"></json-editor> `,
})
export class Test {
  @ViewChild(JsonEditor) jsonEditor: JsonEditor
}

@Component({
  standalone: true,
  imports: [Box, FocusDirective, NgIf, JsonEditor],
  template: ` <json-editor [data]="{ test: 'a' }"></json-editor> `,
})
export class Test2 {
  @ViewChild(JsonEditor) jsonEditor: JsonEditor
}

describe('JsonEditor - ', () => {
  it(`should edit a string`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'y' })
    expect(component.jsonEditor.getValue()).toEqual('stringy')
  }))

  it(`should edit the key`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test2)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'y' })
    expect(component.jsonEditor.getValue()).toEqual({ testy: 'a' })
  }))

  it(`should edit the value`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test2)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'tab' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'b' })
    expect(component.jsonEditor.getValue()).toEqual({ test: 'ab' })
  }))

  it(`should add a new key/value`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test2)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'tab' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'tab' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'k' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'e' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'y' })

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'tab' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'Y' })
    expect(component.jsonEditor.getValue()).toEqual({ test: 'a', key: 'Y' })
  }))
})
