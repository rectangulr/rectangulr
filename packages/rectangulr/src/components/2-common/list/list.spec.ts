import { Component, QueryList, signal, ViewChild, ViewChildren } from '@angular/core'
import { fakeAsync, tick } from '@angular/core/testing'
import { BehaviorSubject } from 'rxjs'
import { FocusDirective } from '../../../commands/focus.directive'
import { H } from '../../../components/1-basics/h'
import { keyboardTest, sendKeyAndDetectChanges, setupTest } from '../../../tests/utils'
import { TextInput } from '../../1-basics/text-input'
import { List } from './list'
import { ListItem } from './list-item'

@Component({
    imports: [List],
    template: `<list [items]="items"></list> `
})
export class Test1 {
  items = [1, 2, 3]
  @ViewChild(List) list: List<number>
}

describe('List - ', () => {
  it('should create', () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    expect(component.list).toBeTruthy()
  })

  it(`should have length 3`, () => {
    const { fixture, component, shortcuts } = setupTest(Test1)

    expect(component.list.items().length).toEqual(3)
  })

  it(`should move down`, () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    shortcuts.incomingKey({ key: { name: 'down' } })
    expect(component.list.selectedIndex()).toEqual(1)
  })

  it(`should move down/up/down`, () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    shortcuts.incomingKey({ key: { name: 'down' } })
    shortcuts.incomingKey({ key: { name: 'up' } })
    shortcuts.incomingKey({ key: { name: 'down' } })
    expect(component.list.selectedIndex()).toEqual(1)
  })

  it(`should pgdown`, () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    shortcuts.incomingKey({ key: { name: 'pgdown' } })
    expect(component.list.selectedIndex()).toEqual(2)
  })
})

@Component({
    imports: [List, H, ListItem],
    template: `<list [items]="items">
    <h *item="let value">item: {{ value }}</h>
  </list> `
})
export class Test2 {
  items = [1, 2, 3]
  @ViewChild(List) list: List<number>
}

describe('List - ', () => {
  it('should use the item template', () => {
    const { fixture, component, shortcuts } = setupTest(Test2)
    const elements = fixture.debugElement
      .queryAllNodes(node => node.nativeNode.name == 'text')
      .map(n => n.nativeNode)
    expect(elements[0].textContent).toBe('item: 1')
  })

  it(`should focus the first of the list`, fakeAsync(() => {
    const { fixture, component, shortcuts } = setupTest(Test2)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'pgdown' })
    expect(component.list.selectedIndex()).toEqual(2)

  }))
})

@Component({
    imports: [List, ListItem, TextInput, FocusDirective],
    template: `
    <list [items]="items">
      <text-input focus *item="let value" [text]="value"></text-input>
    </list>
  `
})
export class Test3 {
  items = ['text1', 'text2', 'text3']
  @ViewChild(List) list: List<number>
  @ViewChildren(TextInput) inputs: QueryList<TextInput>
}

describe('List - ', () => {
  it(`should contain the text-input's text`, () => {
    const { fixture, component, shortcuts } = setupTest(Test3)
    expect(component.inputs.get(0).text()).toBe('text1')
    expect(component.inputs.get(1).text()).toBe('text2')
    expect(component.inputs.get(2).text()).toBe('text3')
  })

  it(`should focus the first line of the list`, keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test3)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: '-' })
    expect(component.inputs.get(0).text()).toBe('text1-')
    expect(component.inputs.get(1).text()).toBe('text2')
    expect(component.inputs.get(2).text()).toBe('text3')
  }))

  it(`should focus the second line of the list`, keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test3)
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'down' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: '-' })

    expect(component.inputs.get(0).text()).toBe('text1')
    expect(component.inputs.get(1).text()).toBe('text2-')
    expect(component.inputs.get(2).text()).toBe('text3')
  }))
})

describe('List - ', () => {
  @Component({
    selector: 'test-list-4',
    imports: [List],
    template: `<list [items]="items"></list> `
})
  class Test4 {
    items = signal([]) as any
    @ViewChild(List) list: List<any>
  }

  xit(`should work with signals`, fakeAsync(() => {
    const { fixture, component, shortcuts } = setupTest(Test4)
    expect(component.list.selectedValue()).toEqual(undefined)
    component.items.set([1, 2, 3])
    fixture.detectChanges()
    tick()
    expect(component.list.selectedValue()).toEqual(1)

  }))

  xit(`should work with observables`, keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test4)
    component.items = new BehaviorSubject([])
    fixture.detectChanges()
    tick()
    expect(component.list.selectedValue()).toEqual(undefined)
    component.items.next([1, 2, 3])
    // TODO
    expect(component.list.selectedValue()).toEqual(1)
  }))
})
