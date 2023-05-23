import { NgIf } from '@angular/common'
import { Component, NgZone, QueryList, ViewChild, ViewChildren } from '@angular/core'
import { fakeAsync, TestBed, tick } from '@angular/core/testing'
import { Logger } from '../angular-terminal/logger'
import { HBox } from '../components/1-basics/box'
import { TextInput } from '../components/1-basics/text-input'
import { List } from '../components/2-common/list/list'
import { ListItem } from '../components/2-common/list/list-item'
import { sendKeyAndDetectChanges, setupTest } from '../utils/tests'
import { FocusDirective } from './focus.directive'
import { getFocusedNode, ShortcutService } from './shortcut.service'

describe('ShortcutService Class', () => {
  let shortcuts: ShortcutService

  beforeEach(() => {
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({})
    shortcuts = new ShortcutService(null, TestBed.inject(Logger), null, TestBed.inject(NgZone))
  })

  it('should register a shortcut', fakeAsync(() => {
    const spy = { handler: () => {} }
    spyOn(spy, 'handler')
    shortcuts.registerCommand({
      keys: 'ctrl+r',
      func: spy.handler,
    })
    sendKeyAndDetectChanges(null, shortcuts, { ctrl: true, name: 'r' })
    expect(spy.handler).toHaveBeenCalled()
  }))

  it('should register/remove a shortcut', fakeAsync(() => {
    const spy = { handler: () => {} }
    spyOn(spy, 'handler')
    const disposable = shortcuts.registerCommand({
      keys: 'ctrl+r',
      func: spy.handler,
    })
    sendKeyAndDetectChanges(null, shortcuts, { ctrl: true, name: 'r' })
    expect(spy.handler).toHaveBeenCalledTimes(1)
    disposable.dispose()
    sendKeyAndDetectChanges(null, shortcuts, { ctrl: true, name: 'r' })
    expect(spy.handler).toHaveBeenCalledTimes(1)
  }))
})

//

@Component({
  standalone: true,
  imports: [HBox, FocusDirective, NgIf],
  template: `
    <vbox
      #first
      *ngIf="showFirst"
      [focusShortcuts]="[{ keys: 'ctrl+r', func: callsMethod('firstFunc') }]"></vbox>
    <vbox
      #second
      *ngIf="showSecond"
      [focusShortcuts]="[{ keys: 'ctrl+r', func: callsMethod('secondFunc') }]"></vbox>
  `,
  providers: [ShortcutService],
})
export class Test1 {
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
  // let fixture: ComponentFixture<TestNgIf>
  // let component: TestNgIf
  // let shortcuts: ShortcutService

  // beforeEach(() => {
  //   TestBed.resetTestingModule()
  //   TestBed.configureTestingModule({})
  //   fixture = TestBed.createComponent(TestNgIf)
  //   component = fixture.componentInstance
  //   shortcuts = component.shortcutService
  //   fixture.detectChanges()
  // })

  it('should setup ok', async () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    expect(component.first).toBeTruthy()
    expect(component.second).toBeTruthy()
    expect(component.shortcutService).toBeTruthy()
    expect(Object.values(shortcuts.shortcuts).length).toEqual(0)
  })

  it('should focus first box', () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    expect(getFocusedNode(shortcuts)).toBe(component.first)
  })

  it(`should focus according to ngIfs`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test1)

    spyOn(component, 'firstFunc')
    spyOn(component, 'secondFunc')

    function logZone() {
      // @ts-ignore
      TestBed.inject(Logger).log(Zone.current._zoneDelegate._taskCounts)
    }

    function log(thing) {
      TestBed.inject(Logger).log(thing)
    }

    log('ctrl+r')
    sendKeyAndDetectChanges(fixture, shortcuts, { ctrl: true, name: 'r' })
    expect(component.firstFunc).toHaveBeenCalledTimes(1)
    expect(component.secondFunc).toHaveBeenCalledTimes(0)

    component.showFirst = false
    log('tick')
    tick()

    log('detectChanges')
    fixture.detectChanges()

    log('tick')
    tick()

    log('ctrl+r')
    sendKeyAndDetectChanges(fixture, shortcuts, { ctrl: true, name: 'r' })

    expect(component.firstFunc).toHaveBeenCalledTimes(1)
    expect(component.secondFunc).toHaveBeenCalledTimes(1)

    log('showFirst true')
    component.showFirst = true
    // logZone()

    log('tick')
    tick()

    // logZone()

    log('detectChanges')
    fixture.detectChanges()
    // logZone()

    log('tick')
    tick()

    // logZone()

    log('ctrl+r')
    sendKeyAndDetectChanges(fixture, shortcuts, { ctrl: true, name: 'r' })

    log('expect')
    expect(component.firstFunc).toHaveBeenCalledTimes(2)
    expect(component.secondFunc).toHaveBeenCalledTimes(1)
  }))
})

//

@Component({
  standalone: true,
  imports: [HBox, FocusDirective, NgIf],
  template: `
    <vbox
      [focusIf]="focused == 'first'"
      [focusShortcuts]="[{ keys: 'ctrl+r', func: callsMethod('firstFunc') }]"></vbox>
    <vbox
      [focusIf]="focused == 'second'"
      [focusShortcuts]="[{ keys: 'ctrl+r', func: callsMethod('secondFunc') }]"></vbox>
  `,
  providers: [ShortcutService],
})
export class Test2 {
  focused: 'first' | 'second' = 'first'

  constructor(public shortcutService: ShortcutService) {}

  firstFunc() {}
  secondFunc() {}

  callsMethod = methodName => {
    return () => this[methodName]()
  }
}

describe('ShortcutService FocusIf - ', () => {
  // let fixture: ComponentFixture<TestFocusIf>
  // let component: TestFocusIf
  // let shortcuts: ShortcutService

  // beforeEach(() => {
  //   fixture = TestBed.createComponent(TestFocusIf)
  //   component = fixture.componentInstance
  //   shortcuts = component.shortcutService
  //   fixture.detectChanges()
  // })

  it(`should focus the second box when focusIf=='second'`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test2)

    spyOn(component, 'firstFunc')
    spyOn(component, 'secondFunc')

    sendKeyAndDetectChanges(fixture, shortcuts, { ctrl: true, name: 'r' })
    expect(component.firstFunc).toHaveBeenCalledTimes(1)
    expect(component.secondFunc).toHaveBeenCalledTimes(0)

    component.focused = 'second'
    fixture.detectChanges()
    sendKeyAndDetectChanges(fixture, shortcuts, { ctrl: true, name: 'r' })
    expect(component.firstFunc).toHaveBeenCalledTimes(1)
    expect(component.secondFunc).toHaveBeenCalledTimes(1)

    component.focused = 'first'
    fixture.detectChanges()
    sendKeyAndDetectChanges(fixture, shortcuts, { ctrl: true, name: 'r' })
    expect(component.firstFunc).toHaveBeenCalledTimes(2)
    expect(component.secondFunc).toHaveBeenCalledTimes(1)
  }))
})

//

@Component({
  standalone: true,
  imports: [HBox, FocusDirective, NgIf],
  template: ` <vbox [focusShortcuts]="shortcuts"></vbox> `,
  providers: [ShortcutService],
})
export class Test3 {
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
  // let fixture: ComponentFixture<Test>
  // let component: Test
  // let shortcuts: ShortcutService

  // beforeEach(() => {
  //   fixture = TestBed.createComponent(Test)
  //   component = fixture.componentInstance
  //   shortcuts = component.shortcutService
  //   fixture.detectChanges()
  // })

  it(`should call latest registered shortcut`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test3)

    spyOn(component, 'firstFunc')
    spyOn(component, 'secondFunc')

    sendKeyAndDetectChanges(fixture, shortcuts, { ctrl: true, name: 'r' })
    expect(component.firstFunc).toHaveBeenCalledTimes(0)
    expect(component.secondFunc).toHaveBeenCalledTimes(1)
  }))
})

//

@Component({
  standalone: true,
  selector: 'shortcut-test-4',
  imports: [HBox, FocusDirective, NgIf, TextInput],
  template: ` <text-input [focusIf]="condition"></text-input> `,
})
export class Test4 {
  condition = true
  constructor(public shortcutService: ShortcutService) {}
  @ViewChild(TextInput) input: TextInput
}

describe('ShortcutService - ', () => {
  // let fixture: ComponentFixture<Test4>
  // let component: Test4
  // let shortcuts: ShortcutService

  // beforeEach(async () => {
  //   TestBed.resetTestingModule()
  //   TestBed.configureTestingModule({
  //     providers: [ShortcutService],
  //   })
  //   fixture = TestBed.createComponent(Test4)
  //   component = fixture.componentInstance
  //   shortcuts = component.shortcutService
  //   fixture.detectChanges()
  // })

  it(`should focus the text-input and accept inputs`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test4)

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'a' })
    expect(component.input.text).toEqual('a')
  }))

  it(`shouldn't focus the text-input`, fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test4)

    component.condition = false
    fixture.detectChanges()

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'a' })
    expect(component.input.text).toEqual('')
  }))
})

//

@Component({
  standalone: true,
  imports: [HBox, NgIf, TextInput, List, ListItem, FocusDirective],
  template: `
    <list [items]="items">
      <vbox *item focus>
        <text-input [text]=""></text-input>
      </vbox>
    </list>
  `,
})
export class Test5 {
  condition = true
  items = [1, 2, 3]
  noop = () => {}
  constructor(public shortcutService: ShortcutService) {}
  @ViewChildren(TextInput) input: QueryList<TextInput>
}

describe('ShortcutService - ', () => {
  it('focuses the nested input', fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test5)

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'a' })
    expect(component.input.get(0).text).withContext('input0').toEqual('a')
    expect(component.input.get(1).text).withContext('input1').toEqual('')
    expect(component.input.get(2).text).withContext('input2').toEqual('')
  }))

  it('focuses the 2nd nested input', fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test5)

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'down' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'a' })
    expect(component.input.get(0).text).withContext('input0').toEqual('')
    expect(component.input.get(1).text).withContext('input1').toEqual('a')
    expect(component.input.get(2).text).withContext('input2').toEqual('')
  }))

  it('focuses the 3rd nested input', fakeAsync(async () => {
    const { fixture, component, shortcuts } = setupTest(Test5)

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'down' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'a' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'down' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'b' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'pgup' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'c' })
    expect(component.input.get(0).text).withContext('input0').toEqual('c')
    expect(component.input.get(1).text).withContext('input1').toEqual('a')
    expect(component.input.get(2).text).withContext('input2').toEqual('b')
  }))
})
