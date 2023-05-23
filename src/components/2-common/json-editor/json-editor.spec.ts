import { NgIf } from '@angular/common'
import { Component, ViewChild } from '@angular/core'
import { fakeAsync, tick } from '@angular/core/testing'
import { FocusDirective } from '../../../commands/focus.directive'
import { sendKeyAndDetectChanges, setupTest } from '../../../utils/tests'
import { HBox } from '../../1-basics/box'
import { JsonEditor } from './json-editor'
import { getFocusedNode } from '../../../commands/shortcut.service'
import { TextInput } from '../../1-basics/text-input'

describe('JsonEditor - ', () => {
  it(`should edit a string`, fakeAsync(async () => {
    @Component({
      standalone: true,
      imports: [HBox, FocusDirective, NgIf, JsonEditor],
      template: ` <json-editor data="string"></json-editor> `,
    })
    class Test {
      @ViewChild(JsonEditor) jsonEditor: JsonEditor
    }

    const { fixture, component, shortcuts } = setupTest(Test)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'y' })
    expect(component.jsonEditor.getValue()).toEqual('stringy')
  }))

  @Component({
    standalone: true,
    imports: [HBox, FocusDirective, NgIf, JsonEditor],
    template: ` <json-editor [data]="{ test: 'a' }"></json-editor> `,
  })
  class Test2 {
    @ViewChild(JsonEditor) jsonEditor: JsonEditor
  }

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

  it(`should edit a number`, fakeAsync(async () => {
    @Component({
      standalone: true,
      imports: [HBox, FocusDirective, NgIf, JsonEditor],
      template: ` <json-editor [data]="1"></json-editor> `,
    })
    class Test3 {
      @ViewChild(JsonEditor) jsonEditor: JsonEditor
    }

    const { fixture, component, shortcuts } = setupTest(Test3)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: '2' })
    expect(component.jsonEditor.getValue()).toEqual(12)
  }))

  it(`should focus`, fakeAsync(async () => {
    @Component({
      standalone: true,
      selector: 'test-json-editor-4',
      imports: [HBox, FocusDirective, NgIf, JsonEditor],
      template: `
        <json-editor [data]="{ key1: 'value1', key2: 'value2', key3: 'value3' }"></json-editor>
      `,
    })
    class Test4 {
      @ViewChild(JsonEditor) jsonEditor: JsonEditor
    }

    const { fixture, component, shortcuts } = setupTest(Test4)
    component.jsonEditor.focusJsonPath(['key2'])
    tick()
    const shortcutService = getFocusedNode(component.jsonEditor.shortcutService)
    const focusJsonEditor = Object.entries(shortcutService.commands)[0][1][0].context as TextInput
    expect(focusJsonEditor?.text).toEqual('key2')
  }))
})
