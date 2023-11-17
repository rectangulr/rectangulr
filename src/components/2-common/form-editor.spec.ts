import { Component, ViewChild } from '@angular/core'
import { sendKeyAndDetectChanges, setupTest } from '../../utils/tests'
import { FormEditor } from './form-editor'
import { fakeAsync } from '@angular/core/testing'

@Component({
  standalone: true,
  imports: [FormEditor],
  template: `<form-editor [object]="object"></form-editor> `,
})
export class Test1 {
  object = { name: 'James', age: 25 }
  @ViewChild(FormEditor) editor: FormEditor
}

describe('List - ', () => {
  it('should create', async () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    expect(component.editor).toBeTruthy()
  })

  it(`should move down`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'down' })
    expect(component.editor.list.$selectedIndex()).toEqual(1)
  }))

  it(`should edit first key/value`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 's' })
    expect(component.editor.getValue()).toEqual({ name: 'Jamess', age: 25 })
  }))

  it(`should edit second key/value`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'down' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: '3' })
    expect(component.editor.getValue()).toEqual({ name: 'James', age: 253 })
  }))
})
