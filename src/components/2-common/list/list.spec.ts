import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ShortcutService } from '../../../commands/shortcut.service'
import { FocusDirective } from '../../../public-api'
import { sendKeyAndDetectChanges } from '../../../utils/tests'
import { async } from '../../../utils/utils'
import { Box } from '../../1-basics/box'
import { TextInput } from '../../1-basics/text-input'
import { List } from './list'
import { ListItem } from './list-item'

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
  let fixture: ComponentFixture<Test1>
  let component: Test1
  let shortcuts: ShortcutService

  beforeEach(() => {
    fixture = TestBed.createComponent(Test1)
    component = fixture.componentInstance
    shortcuts = TestBed.inject(ShortcutService)
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component.list).toBeTruthy()
  })

  it(`should have length 3`, () => {
    expect(component.list._items.value.length).toEqual(3)
  })

  it(`should move down`, () => {
    shortcuts.incomingKey({ key: { name: 'down' } })
    expect(component.list.selected.index).toEqual(1)
  })

  it(`should move down/up/down`, () => {
    shortcuts.incomingKey({ key: { name: 'down' } })
    shortcuts.incomingKey({ key: { name: 'up' } })
    shortcuts.incomingKey({ key: { name: 'down' } })
    expect(component.list.selected.index).toEqual(1)
  })

  it(`should pgdown`, () => {
    shortcuts.incomingKey({ key: { name: 'pgdown' } })
    expect(component.list.selected.index).toEqual(2)
  })
})

@Component({
  standalone: true,
  imports: [List, Box, ListItem],
  template: `<list [items]="items">
    <box *item="let value">item: {{ value }}</box>
  </list> `,
})
export class Test2 {
  items = [1, 2, 3]
  @ViewChild(List) list: List<number>
}

describe('List - ', () => {
  let fixture: ComponentFixture<Test2>
  let component: Test2
  let shortcuts: ShortcutService

  beforeEach(async () => {
    fixture = TestBed.createComponent(Test2)
    component = fixture.componentInstance
    shortcuts = TestBed.inject(ShortcutService)
    await async(() => fixture.detectChanges())
  })

  it('should use the item template', () => {
    const elements = fixture.debugElement
      .queryAllNodes(node => node.nativeNode.nodeName == 'TermText2')
      .map(n => n.nativeNode)
    expect(elements[0].textContent).toBe('item: 1')
  })

  it(`should focus the first of the list`, () => {
    shortcuts.incomingKey({ key: { name: 'pgdown' } })
    expect(component.list.selected.index).toEqual(2)
  })
})

@Component({
  standalone: true,
  imports: [List, Box, ListItem, TextInput, FocusDirective],
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
  let fixture: ComponentFixture<Test3>
  let component: Test3
  let shortcuts: ShortcutService

  beforeEach(async () => {
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      providers: [ShortcutService],
    })
    fixture = TestBed.createComponent(Test3)
    component = fixture.componentInstance
    shortcuts = TestBed.inject(ShortcutService)
    await async(() => fixture.detectChanges())
  })

  it(`should contain the text-input's text`, () => {
    expect(component.inputs.get(0).text).toBe('text1')
    expect(component.inputs.get(1).text).toBe('text2')
    expect(component.inputs.get(2).text).toBe('text3')
  })

  it(`should focus the first line of the list`, async () => {
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: '-' })
    expect(component.inputs.get(0).text).toBe('text1-')
    expect(component.inputs.get(1).text).toBe('text2')
    expect(component.inputs.get(2).text).toBe('text3')
  })

  it(`should focus the second line of the list`, async () => {
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: 'down' })
    await sendKeyAndDetectChanges(fixture, shortcuts, { name: '-' })

    expect(component.inputs.get(0).text).toBe('text1')
    expect(component.inputs.get(1).text).toBe('text2-')
    expect(component.inputs.get(2).text).toBe('text3')
  })

  it(`should work with observables`, async () => {})
})
