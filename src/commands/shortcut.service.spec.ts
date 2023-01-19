import { NgIf } from '@angular/common'
import { Component, ViewChild } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Logger } from '../angular-terminal/logger'
import { Box } from '../components/1-basics/box'
import { FocusDirective } from './focus'
import { getFocusedNode, ShortcutService } from './shortcut.service'

describe('ShortcutService Class', () => {
  let shortcuts: ShortcutService

  beforeEach(() => {
    shortcuts = new ShortcutService(null, TestBed.inject(Logger), null)
  })

  it('should register a shortcut', () => {
    const spy = { handler: () => {} }
    spyOn(spy, 'handler')
    shortcuts.registerCommand({
      keys: 'ctrl+r',
      func: spy.handler,
    })
    shortcuts.incomingKey({ key: { ctrl: true, name: 'r' } })
    expect(spy.handler).toHaveBeenCalled()
  })

  it('should register/remove a shortcut', () => {
    const spy = { handler: () => {} }
    spyOn(spy, 'handler')
    const disposable = shortcuts.registerCommand({
      keys: 'ctrl+r',
      func: spy.handler,
    })
    shortcuts.incomingKey({ key: { ctrl: true, name: 'r' } })
    expect(spy.handler).toHaveBeenCalledTimes(1)
    disposable.dispose()
    shortcuts.incomingKey({ key: { ctrl: true, name: 'r' } })
    expect(spy.handler).toHaveBeenCalledTimes(1)
  })
})

@Component({
  standalone: true,
  imports: [Box, FocusDirective, NgIf],
  template: `
    <box
      #first
      *ngIf="showFirst"
      focus
      [focusShortcuts]="[{ keys: 'ctrl+r', func: call('firstFunc') }]"
      [focusIf]="focused == 'first'"></box>
    <box
      #second
      *ngIf="showSecond"
      focus
      [focusShortcuts]="[{ keys: 'ctrl+r', func: call('secondFunc') }]"
      [focusIf]="focused == 'second'"></box>
  `,
  providers: [ShortcutService],
})
class Test {
  constructor(public shortcutService: ShortcutService) {}

  focused: 'first' | 'second' = 'first'
  showFirst = true
  showSecond = true

  @ViewChild('first', { read: ShortcutService }) first: ShortcutService
  @ViewChild('second', { read: ShortcutService }) second: ShortcutService

  firstFunc() {}
  secondFunc() {}

  call = methodName => {
    return () => this[methodName]()
  }
}

describe('ShortcutService Template', () => {
  let fixture: ComponentFixture<Test>
  let component: Test
  let shortcuts: ShortcutService

  beforeEach(() => {
    fixture = TestBed.createComponent(Test)
    component = fixture.componentInstance
    shortcuts = component.shortcutService
    fixture.detectChanges()
  })

  it('should setup ok', () => {
    expect(component.first).toBeTruthy()
    expect(component.second).toBeTruthy()
    expect(component.shortcutService).toBeTruthy()
    expect(Object.values(shortcuts.shortcuts).length).toEqual(0)
  })

  it('should focus first box', () => {
    expect(getFocusedNode(shortcuts)).toBe(component.first)
  })

  it('shortcut->first, hide first, shortcut->second, hide second, shortcut->nothing', () => {
    spyOn(component, 'firstFunc')
    spyOn(component, 'secondFunc')
    shortcuts.incomingKey({ key: { ctrl: true, name: 'r' } })
    expect(component.firstFunc).toHaveBeenCalledTimes(1)
    expect(component.secondFunc).toHaveBeenCalledTimes(0)

    component.showFirst = false
    fixture.detectChanges()
    shortcuts.incomingKey({ key: { ctrl: true, name: 'r' } })
    expect(component.firstFunc).toHaveBeenCalledTimes(1)
    expect(component.secondFunc).toHaveBeenCalledTimes(1)
  })

  it(`should focus the second box when focusIf=='second'`, () => {
    component.focused = 'second'
    fixture.detectChanges()
    expect(getFocusedNode(shortcuts)).toBe(component.second)
  })
})
