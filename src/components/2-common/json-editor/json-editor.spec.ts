import { NgIf } from '@angular/common'
import { Component, ViewChild } from '@angular/core'
import { FocusDirective } from '../../../commands/focus.directive'
import { sendKeyAndDetectChanges, setupTest } from '../../../utils/tests'
import { Box } from '../../1-basics/box'
import { JsonEditor } from './json-editor'

@Component({
  standalone: true,
  imports: [Box, FocusDirective, NgIf, JsonEditor],
  template: ` <json-editor value="test"></json-editor> `,
})
export class Test {
  @ViewChild(JsonEditor) jsonEditor: JsonEditor
}

@Component({
  standalone: true,
  imports: [Box, FocusDirective, NgIf, JsonEditor],
  template: ` <json-editor [value]="{ test: 1 }"></json-editor> `,
})
export class Test2 {
  @ViewChild(JsonEditor) jsonEditor: JsonEditor
}

describe('JsonEditor - ', () => {
  it(`should edit a string`, async () => {
    const { fixture, component, shortcuts } = await setupTest(Test)
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'y' })
    expect(component.jsonEditor.getValue()).toEqual('testy')
  })

  it(`should edit the key`, async () => {
    const { fixture, component, shortcuts } = await setupTest(Test2)
    fixture.detectChanges()
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'y' })
    expect(component.jsonEditor.getValue()).toEqual({ testy: 1 })
  })

  it(`should edit the value`, async () => {
    const { fixture, component, shortcuts } = await setupTest(Test2)
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'tab' })
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: '2' })
    expect(component.jsonEditor.getValue()).toEqual({ test: 12 })
  })
})
