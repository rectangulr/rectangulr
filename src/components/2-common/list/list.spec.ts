import { Component, QueryList, ViewChild, ViewChildren, signal } from '@angular/core'
import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing'
import { FocusDirective } from '../../../commands/focus.directive'
import { sendKeyAndDetectChanges, setupTest } from '../../../utils/tests'
import { HBox } from '../../1-basics/box'
import { TextInput } from '../../1-basics/text-input'
import { List } from './list'
import { ListItem } from './list-item'
import { BehaviorSubject } from 'rxjs'

@Component({
  standalone: true,
  imports: [List],
  template: `<list [items]="items"></list> `,
})
export class Test1 {
  items = [1, 2, 3]
  @ViewChild(List) list: List<number>
}

describe('List - ', () => {
  it('should create', async () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    expect(component.list).toBeTruthy()
  })

  it(`should have length 3`, async () => {
    const { fixture, component, shortcuts } = setupTest(Test1)

    expect(component.list.$items().length).toEqual(3)
  })

  it(`should move down`, async () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    shortcuts.incomingKey({ key: { name: 'down' } })
    expect(component.list.selected().index).toEqual(1)
  })

  it(`should move down/up/down`, async () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    shortcuts.incomingKey({ key: { name: 'down' } })
    shortcuts.incomingKey({ key: { name: 'up' } })
    shortcuts.incomingKey({ key: { name: 'down' } })
    expect(component.list.selected().index).toEqual(1)
  })

  it(`should pgdown`, async () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    shortcuts.incomingKey({ key: { name: 'pgdown' } })
    expect(component.list.selected().index).toEqual(2)
  })
})

@Component({
  standalone: true,
  imports: [List, HBox, ListItem],
  template: `<list [items]="items">
    <h *item="let value">item: {{ value }}</h>
  </list> `,
})
export class Test2 {
  items = [1, 2, 3]
  @ViewChild(List) list: List<number>
}

describe('List - ', () => {
  it('should use the item template', async () => {
    const { fixture, component, shortcuts } = setupTest(Test2)
    const elements = fixture.debugElement
      .queryAllNodes(node => node.nativeNode.name == 'text')
      .map(n => n.nativeNode)
    expect(elements[0].textContent).toBe('item: 1')
  })

  it(`should focus the first of the list`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test2)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'pgdown' })
    expect(component.list.selected().index).toEqual(2)
  }))
})

@Component({
  standalone: true,
  imports: [List, HBox, ListItem, TextInput, FocusDirective],
  template: `
    <list [items]="items">
      <text-input focus *item="let value" [text]="value"></text-input>
    </list>
  `,
})
export class Test3 {
  items = ['text1', 'text2', 'text3']
  @ViewChild(List) list: List<number>
  @ViewChildren(TextInput) inputs: QueryList<TextInput>
}

describe('List - ', () => {
  it(`should contain the text-input's text`, async () => {
    const { fixture, component, shortcuts } = setupTest(Test3)
    expect(component.inputs.get(0).text).toBe('text1')
    expect(component.inputs.get(1).text).toBe('text2')
    expect(component.inputs.get(2).text).toBe('text3')
  })

  it(`should focus the first line of the list`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test3)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: '-' })
    expect(component.inputs.get(0).text).toBe('text1-')
    expect(component.inputs.get(1).text).toBe('text2')
    expect(component.inputs.get(2).text).toBe('text3')
  }))

  it(`should focus the second line of the list`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test3)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'down' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: '-' })

    expect(component.inputs.get(0).text).toBe('text1')
    expect(component.inputs.get(1).text).toBe('text2-')
    expect(component.inputs.get(2).text).toBe('text3')
  }))
})

describe('List - ', () => {
  @Component({
    standalone: true,
    selector: 'test-list-4',
    imports: [List],
    template: `<list [items]="items"></list> `,
  })
  class Test4 {
    items = signal([]) as any
    @ViewChild(List) list: List<any>
  }

  it(`should work with signals`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test4)
    expect(component.list.selected().value).toEqual(null)
    component.items.set([1, 2, 3])
    fixture.detectChanges()
    tick()
    expect(component.list.selected().value).toEqual(1)
  }))

  it(`should work with observables`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test4)
    component.items = new BehaviorSubject([])
    fixture.detectChanges()
    tick()
    expect(component.list.selected().value).toEqual(null)
    component.items.next([1, 2, 3])
    fixture.detectChanges()
    tick()
    expect(component.list.selected().value).toEqual(1)
  }))
})
