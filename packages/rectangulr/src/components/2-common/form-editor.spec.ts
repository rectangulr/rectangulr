import { Component, ViewChild } from '@angular/core'
import { keyboardTest, sendKeyAndDetectChanges, setupTest } from '../../tests/utils'
import { FormEditor } from './form-editor'

@Component({
  template: `<form-editor [object]="object"/>`,
  standalone: true,
  imports: [FormEditor],
})
export class Test1 {
  object = { name: 'James', age: 25 }
  @ViewChild(FormEditor) editor: FormEditor
}

describe('FormEditor - ', () => {
  it('should create', () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    expect(component.editor).toBeTruthy()
  })

  it(`should move down`, keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'down' })
    expect(component.editor.list().selectedIndex()).toEqual(1)
  }))

  it(`should edit first key/value`, keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 's' })
    expect(component.editor.getValue()).toEqual({ name: 'Jamess', age: 25 })
  }))

  it(`should edit second key/value`, keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'down' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: '3' })
    expect(component.editor.getValue()).toEqual({ name: 'James', age: 253 })
  }))
})
