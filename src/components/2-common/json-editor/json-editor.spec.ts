import { NgIf } from '@angular/common'
import { Component, ViewChild } from '@angular/core'
import { FocusDirective } from '../../../commands/focus.directive'
import { sendKeyAndDetectChanges, setupTest } from '../../../utils/tests'
import { Box } from '../../1-basics/box'
import { JsonEditor } from './json-editor'

@Component({
  standalone: true,
  imports: [Box, FocusDirective, NgIf, JsonEditor],
  template: ` <json-editor value="string"></json-editor> `,
})
export class Test {
  @ViewChild(JsonEditor) jsonEditor: JsonEditor
}

@Component({
  standalone: true,
  imports: [Box, FocusDirective, NgIf, JsonEditor],
  template: ` <json-editor [value]="{ test: 'a' }"></json-editor> `,
})
export class Test2 {
  @ViewChild(JsonEditor) jsonEditor: JsonEditor
}

describe('JsonEditor - ', () => {
  it(`should edit a string`, async () => {
    const { fixture, component, shortcuts } = await setupTest(Test)
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'y' })
    expect(component.jsonEditor.getValue()).toEqual('stringy')
  })

  it(`should edit the key`, async () => {
    const { fixture, component, shortcuts } = await setupTest(Test2)
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'y' })
    expect(component.jsonEditor.getValue()).toEqual({ testy: 'a' })
  })

  it(`should edit the value`, async () => {
    const { fixture, component, shortcuts } = await setupTest(Test2)
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'tab' })
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'b' })
    expect(component.jsonEditor.getValue()).toEqual({ test: 'ab' })
  })

  it(`should add a new key/value`, async () => {
    const { fixture, component, shortcuts } = await setupTest(Test2)
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'tab' })
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'tab' })
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'k' })
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'e' })
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'y' })
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'tab' })
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'b' })
    expect(component.jsonEditor.getValue()).toEqual({ test: 'a', key: 'b' })
  })
})
