import { NgIf } from '@angular/common'
import { Component, ViewChild } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Logger } from '../angular-terminal/logger'
import { Box } from '../components/1-basics/box'
import { async } from '../utils/utils'
import { FocusDirective } from './focus.directive'
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
      [focusShortcuts]="[{ keys: 'ctrl+r', func: callsMethod('firstFunc') }]"></box>
    <box
      #second
      *ngIf="showSecond"
      [focusShortcuts]="[{ keys: 'ctrl+r', func: callsMethod('secondFunc') }]"></box>
  `,
  providers: [ShortcutService],
})
class TestNgIf {
  constructor(public shortcutService: ShortcutService) {}

  showFirst = true
  showSecond = true

  @ViewChild('first', { read: ShortcutService }) first: ShortcutService
  @ViewChild('second', { read: ShortcutService }) second: ShortcutService

  firstFunc() {}
  secondFunc() {}

  callsMethod = methodName => {
    return () => this[methodName]()
  }
}

describe('ShortcutService ngIf - ', () => {
  let fixture: ComponentFixture<TestNgIf>
  let component: TestNgIf
  let shortcuts: ShortcutService

  beforeEach(() => {
    fixture = TestBed.createComponent(TestNgIf)
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

  it(`should focus according to ngIfs`, async () => {
    spyOn(component, 'firstFunc')
    spyOn(component, 'secondFunc')

    shortcuts.incomingKey({ key: { ctrl: true, name: 'r' } })
    expect(component.firstFunc).toHaveBeenCalledTimes(1)
    expect(component.secondFunc).toHaveBeenCalledTimes(0)

    component.showFirst = false
    await async(() => fixture.detectChanges())
    shortcuts.incomingKey({ key: { ctrl: true, name: 'r' } })
    expect(component.firstFunc).toHaveBeenCalledTimes(1)
    expect(component.secondFunc).toHaveBeenCalledTimes(1)

    component.showFirst = true
    await async(() => fixture.detectChanges())
    shortcuts.incomingKey({ key: { ctrl: true, name: 'r' } })
    expect(component.firstFunc).toHaveBeenCalledTimes(2)
    expect(component.secondFunc).toHaveBeenCalledTimes(1)
  })
})

@Component({
  standalone: true,
  imports: [Box, FocusDirective, NgIf],
  template: `
    <box
      [focusIf]="focused == 'first'"
      [focusShortcuts]="[{ keys: 'ctrl+r', func: callsMethod('firstFunc') }]"></box>
    <box
      [focusIf]="focused == 'second'"
      [focusShortcuts]="[{ keys: 'ctrl+r', func: callsMethod('secondFunc') }]"></box>
  `,
  providers: [ShortcutService],
})
class TestFocusIf {
  focused: 'first' | 'second' = 'first'

  constructor(public shortcutService: ShortcutService) {}

  firstFunc() {}
  secondFunc() {}

  callsMethod = methodName => {
    return () => this[methodName]()
  }
}

describe('ShortcutService FocusIf - ', () => {
  let fixture: ComponentFixture<TestFocusIf>
  let component: TestFocusIf
  let shortcuts: ShortcutService

  beforeEach(() => {
    fixture = TestBed.createComponent(TestFocusIf)
    component = fixture.componentInstance
    shortcuts = component.shortcutService
    fixture.detectChanges()
  })

  it(`should focus the second box when focusIf=='second'`, async () => {
    spyOn(component, 'firstFunc')
    spyOn(component, 'secondFunc')

    shortcuts.incomingKey({ key: { ctrl: true, name: 'r' } })
    expect(component.firstFunc).toHaveBeenCalledTimes(1)
    expect(component.secondFunc).toHaveBeenCalledTimes(0)

    component.focused = 'second'
    await async(() => fixture.detectChanges())
    shortcuts.incomingKey({ key: { ctrl: true, name: 'r' } })
    expect(component.firstFunc).toHaveBeenCalledTimes(1)
    expect(component.secondFunc).toHaveBeenCalledTimes(1)

    component.focused = 'first'
    await async(() => fixture.detectChanges())
    shortcuts.incomingKey({ key: { ctrl: true, name: 'r' } })
    expect(component.firstFunc).toHaveBeenCalledTimes(2)
    expect(component.secondFunc).toHaveBeenCalledTimes(1)
  })
})

@Component({
  standalone: true,
  imports: [Box, FocusDirective, NgIf],
  template: ` <box [focusShortcuts]="shortcuts"></box> `,
  providers: [ShortcutService],
})
class Test {
  focused: 'first' | 'second' = 'first'
  callsMethod = methodName => {
    return () => this[methodName]()
  }
  shortcuts = [
    { keys: 'ctrl+r', func: this.callsMethod('firstFunc') },
    { keys: 'ctrl+r', func: this.callsMethod('secondFunc') },
  ]

  constructor(public shortcutService: ShortcutService) {}

  firstFunc() {}
  secondFunc() {}
}

describe('ShortcutService - ', () => {
  let fixture: ComponentFixture<Test>
  let component: Test
  let shortcuts: ShortcutService

  beforeEach(() => {
    fixture = TestBed.createComponent(Test)
    component = fixture.componentInstance
    shortcuts = component.shortcutService
    fixture.detectChanges()
  })

  it(`should call latest registered shortcut`, async () => {
    spyOn(component, 'firstFunc')
    spyOn(component, 'secondFunc')

    shortcuts.incomingKey({ key: { ctrl: true, name: 'r' } })
    expect(component.firstFunc).toHaveBeenCalledTimes(0)
    expect(component.secondFunc).toHaveBeenCalledTimes(1)
  })
})
