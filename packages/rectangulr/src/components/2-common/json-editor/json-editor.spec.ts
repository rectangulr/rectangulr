import { Component, ViewChild } from '@angular/core'
import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing'
import { FocusDirective } from '../../../commands/focus.directive'
import { sendKeyAndDetectChanges, setupTest } from '../../../utils/tests'
import { HBox } from '../../1-basics/box'
import { JsonEditor } from './json-editor'

describe('JsonEditor - ', () => {

  it(`should edit a string`, fakeAsync(async () => {
    @Component({
      standalone: true,
      imports: [HBox, FocusDirective, JsonEditor],
      template: ` <json-editor data="string"/> `,
    })
    class Test {
      @ViewChild(JsonEditor) jsonEditor: JsonEditor
    }

    const { fixture, component, shortcuts } = setupTest(Test)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'y' })
    expect(component.jsonEditor.getValue()).toEqual('stringy')
    discardPeriodicTasks()
  }))

  @Component({
    standalone: true,
    imports: [HBox, FocusDirective, JsonEditor],
    template: ` <json-editor [data]="{ test: 'a' }"/> `,
  })
  class Test2 {
    @ViewChild(JsonEditor) jsonEditor: JsonEditor
  }

  it(`should edit the key`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test2)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'shift+tab' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'y' })
    expect(component.jsonEditor.getValue()).toEqual({ testy: 'a' })
    discardPeriodicTasks()
  }))

  it(`should edit the value`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test2)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'b' })
    expect(component.jsonEditor.getValue()).toEqual({ test: 'ab' })
    discardPeriodicTasks()
  }))

  it(`should add a new key/value`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test2)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'tab' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'k' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'e' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'y' })

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'tab' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'Y' })
    expect(component.jsonEditor.getValue()).toEqual({ test: 'a', key: 'Y' })
    discardPeriodicTasks()
  }))

  it(`should edit a number`, fakeAsync(async () => {
    @Component({
      standalone: true,
      imports: [HBox, FocusDirective, JsonEditor],
      template: ` <json-editor [data]="1"/> `,
    })
    class Test3 {
      @ViewChild(JsonEditor) jsonEditor: JsonEditor
    }

    const { fixture, component, shortcuts } = setupTest(Test3)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: '2' })
    expect(component.jsonEditor.getValue()).toEqual(12)
    discardPeriodicTasks()
  }))

  it(`should focus`, fakeAsync(async () => {
    @Component({
      standalone: true,
      selector: 'test-json-editor-4',
      imports: [HBox, FocusDirective, JsonEditor],
      template: `
        <json-editor [data]="{ key1: 'value1', key2: 'value2', key3: 'value3' }"/>
      `,
    })
    class Test4 {
      @ViewChild(JsonEditor) jsonEditor: JsonEditor
    }

    const { fixture, component, shortcuts } = setupTest(Test4)
    component.jsonEditor.focusJsonPath(['key2'])
    tick()
    sendKeyAndDetectChanges(fixture, shortcuts, { name: '3' })
    expect(component.jsonEditor.getValue()).toEqual({
      key1: 'value1',
      key2: 'value23',
      key3: 'value3',
    })
    discardPeriodicTasks()
  }))
})
