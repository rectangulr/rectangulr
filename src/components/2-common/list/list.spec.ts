import { Component, ViewChild } from '@angular/core'
import { inject, TestBed } from '@angular/core/testing'
import { ShortcutService } from '../../../commands/shortcut.service'
import { List } from './list'

@Component({
  standalone: true,
  imports: [List],
  template: `<list [items]="items"></list> `,
})
export class TestList {
  items = [1, 2, 3]
  @ViewChild(List) list: List<number>
}

describe('List', () => {
  it('should create', () => {
    const fixture = TestBed.createComponent(TestList)
    const list = fixture.componentInstance
    expect(list).toBeTruthy()
  })

  it(`should have length 3`, () => {
    const fixture = TestBed.createComponent(TestList)
    const test = fixture.componentInstance
    fixture.detectChanges()
    expect(test.list._items.value.length).toEqual(3)
  })

  it(`should move down`, inject([ShortcutService], shortcutService => {
    const fixture = TestBed.createComponent(TestList)
    const test = fixture.componentInstance
    fixture.detectChanges()
    shortcutService.incomingKey({ key: { name: 'down' } })
    expect(test.list.selected.index).toEqual(1)
  }))

  it(`should move up/down`, inject([ShortcutService], shortcutService => {
    const fixture = TestBed.createComponent(TestList)
    const test = fixture.componentInstance
    fixture.detectChanges()
    shortcutService.incomingKey({ key: { name: 'down' } })
    shortcutService.incomingKey({ key: { name: 'up' } })
    shortcutService.incomingKey({ key: { name: 'down' } })
    expect(test.list.selected.index).toEqual(1)
  }))
})
