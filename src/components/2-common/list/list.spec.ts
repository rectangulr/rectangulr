import { Component, ViewChild } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ShortcutService } from '../../../commands/shortcut.service'
import { List } from './list'

@Component({
  standalone: true,
  imports: [List],
  template: `<list [items]="items"></list> `,
})
export class TestComponent {
  items = [1, 2, 3]
  @ViewChild(List) list: List<number>
}

describe('List', () => {
  let fixture: ComponentFixture<TestComponent>
  let component: TestComponent
  let shortcuts: ShortcutService

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent)
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
