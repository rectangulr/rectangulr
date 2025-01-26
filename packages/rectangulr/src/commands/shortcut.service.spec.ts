import { Component, EventEmitter, Output, QueryList, ViewChild, ViewChildren, input, signal, inject, NO_ERRORS_SCHEMA } from '@angular/core'
import { TestBed, discardPeriodicTasks, flush, tick } from '@angular/core/testing'
import { Subject } from 'rxjs'
import { keyboardTest } from "../tests/utils"
import { cond } from '../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'
import { LOGGER } from '../angular-terminal/logger'
import { H } from '../components/1-basics/h'
import { V } from '../components/1-basics/v'
import { StyleDirective } from '../components/1-basics/style'
import { TextInput } from '../components/1-basics/text-input'
import { List } from '../components/2-common/list/list'
import { ListItem } from '../components/2-common/list/list-item'
import { signal2 } from '../utils/Signal2'
import { sendKeyAndDetectChanges, setupTest } from '../tests/utils'
import { FocusDirective } from './focus.directive'
import { Command, ShortcutService, getFocusedNode, registerShortcuts } from './shortcut.service'
import { removeLastMatch } from '../utils/utils'

describe('ShortcutService Class', () => {
  let shortcuts: ShortcutService

  beforeEach(() => {
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
    })
    shortcuts = TestBed.inject(ShortcutService)
  })

  it('should register a shortcut', keyboardTest(() => {
    const spy = { handler: () => { } }
    spyOn(spy, 'handler')
    shortcuts.registerCommand({
      keys: 'ctrl+r',
      func: spy.handler,
    })
    sendKeyAndDetectChanges(null, shortcuts, { ctrl: true, name: 'r' })
    expect(spy.handler).toHaveBeenCalled()
  }))

  it('should register/remove a shortcut', keyboardTest(() => {
    const spy = { handler: () => { } }
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
    imports: [V, FocusDirective],
    template: `
    @if (showFirst()) {
      <v
        #first
        [focusShortcuts]="[{ keys: 'ctrl+r', func: callsMethod('firstFunc') }]"
      ></v>
    }
    @if (showSecond()) {
      <v
        #second
        [focusShortcuts]="[{ keys: 'ctrl+r', func: callsMethod('secondFunc') }]"
        ></v>
    }
    `,
    providers: [ShortcutService]
})
export class Test1 {
  shortcutService = inject(ShortcutService)

  showFirst = signal(true)
  showSecond = signal(true)

  @ViewChild('first', { read: ShortcutService }) first: ShortcutService
  @ViewChild('second', { read: ShortcutService }) second: ShortcutService

  firstFunc() { }
  secondFunc() { }

  callsMethod = methodName => {
    return () => this[methodName]()
  }
}

describe('ShortcutService @if - ', () => {
  it('should setup ok', async () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    expect(component.first).toBeTruthy()
    expect(component.second).toBeTruthy()
    expect(component.shortcutService).toBeTruthy()
    expect(Object.values(shortcuts.shortcuts()).length).toEqual(0)
  })

  it('should focus first box', () => {
    const { fixture, component, shortcuts } = setupTest(Test1)
    expect(getFocusedNode(shortcuts)).toBe(component.first)
  })

  it(`should focus according to @if`, keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test1)

    spyOn(component, 'firstFunc')
    spyOn(component, 'secondFunc')

    function logZone() {
      // @ts-ignore
      TestBed.inject(LOGGER).log(Zone.current._zoneDelegate._taskCounts)
    }

    function log(thing) {
      TestBed.inject(LOGGER).log(thing)
    }

    log('ctrl+r')
    sendKeyAndDetectChanges(fixture, shortcuts, { ctrl: true, name: 'r' })
    expect(component.firstFunc).toHaveBeenCalledTimes(1)
    expect(component.secondFunc).toHaveBeenCalledTimes(0)

    component.showFirst.set(false)
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
    component.showFirst.set(true)
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
    flush()
  }))
})

//

@Component({
    imports: [FocusDirective],
    template: `
    <v
      [focusIf]="focused() == 'first'"
      [focusShortcuts]="[{ keys: 'ctrl+r', func: callsMethod('firstFunc') }]"></v>
    <v
      [focusIf]="focused() == 'second'"
      [focusShortcuts]="[{ keys: 'ctrl+r', func: callsMethod('secondFunc') }]"></v>
  `,
    providers: [ShortcutService]
})
export class Test2 {
  shortcutService = inject(ShortcutService)

  focused = signal2<'first' | 'second'>('first')

  firstFunc() { }
  secondFunc() { }

  callsMethod = methodName => {
    return () => this[methodName]()
  }
}

describe('ShortcutService FocusIf - ', () => {
  it(`should focus the second box when focusIf=='second'`, keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test2)

    spyOn(component, 'firstFunc')
    spyOn(component, 'secondFunc')

    sendKeyAndDetectChanges(fixture, shortcuts, { ctrl: true, name: 'r' })
    expect(component.firstFunc).toHaveBeenCalledTimes(1)
    expect(component.secondFunc).toHaveBeenCalledTimes(0)

    component.focused.$ = 'second'
    fixture.detectChanges()
    sendKeyAndDetectChanges(fixture, shortcuts, { ctrl: true, name: 'r' })
    expect(component.firstFunc).toHaveBeenCalledTimes(1)
    expect(component.secondFunc).toHaveBeenCalledTimes(1)

    component.focused.$ = 'first'
    fixture.detectChanges()
    sendKeyAndDetectChanges(fixture, shortcuts, { ctrl: true, name: 'r' })
    expect(component.firstFunc).toHaveBeenCalledTimes(2)
    expect(component.secondFunc).toHaveBeenCalledTimes(1)
  }))
})

//

@Component({
    template: `<v [focusShortcuts]="shortcuts">`,
    providers: [ShortcutService],
    imports: [V, FocusDirective]
})
export class Test3 {
  shortcutService = inject(ShortcutService)

  focused: 'first' | 'second' = 'first'
  callsMethod = methodName => {
    return () => this[methodName]()
  }
  shortcuts = [
    { keys: 'ctrl+r', func: this.callsMethod('firstFunc') },
    { keys: 'ctrl+r', func: this.callsMethod('secondFunc') },
  ]

  firstFunc() { }
  secondFunc() { }
}

describe('ShortcutService - ', () => {
  it(`should call latest registered shortcut`, keyboardTest(() => {
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
    selector: 'shortcut-test-4',
    imports: [FocusDirective, TextInput],
    template: `<text-input [focusIf]="condition()"/>`
})
export class Test4 {
  shortcutService = inject(ShortcutService)

  condition = signal2(true)
  @ViewChild(TextInput) input: TextInput
}

describe('ShortcutService - ', () => {
  it(`should focus the text-input and accept inputs`, keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test4)

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'a' })
    expect(component.input.text()).toEqual('a')
  }))

  it(`shouldn't focus the text-input`, keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test4)

    component.condition.$ = false
    fixture.detectChanges()

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'a' })
    expect(component.input.text()).toEqual('')
  }))
})

//

@Component({
    imports: [TextInput, List, ListItem, FocusDirective],
    template: `
    <list [items]="items">
      <v *item focus>
        <text-input [text]=""></text-input>
      </v>
    </list>
  `
})
export class Test5 {
  shortcutService = inject(ShortcutService)

  condition = true
  items = [1, 2, 3]
  noop = () => { }
  @ViewChildren(TextInput) input: QueryList<TextInput>
}

describe('ShortcutService - ', () => {
  it('focuses the nested input', keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test5)

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'a' })
    expect(component.input.get(0).text()).withContext('input0').toEqual('a')
    expect(component.input.get(1).text()).withContext('input1').toEqual('')
    expect(component.input.get(2).text()).withContext('input2').toEqual('')

  }))

  it('focuses the 2nd nested input', keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test5)

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'down' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'a' })
    expect(component.input.get(0).text()).withContext('input0').toEqual('')
    expect(component.input.get(1).text()).withContext('input1').toEqual('a')
    expect(component.input.get(2).text()).withContext('input2').toEqual('')

  }))

  it('focuses the 3rd nested input', keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test5)

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'down' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'a' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'down' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'b' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'pgup' })
    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'c' })
    expect(component.input.get(0).text()).withContext('input0').toEqual('c')
    expect(component.input.get(1).text()).withContext('input1').toEqual('a')
    expect(component.input.get(2).text()).withContext('input2').toEqual('b')

  }))
})

@Component({
  selector: 'Test6Comp',
  standalone: true,
  template: `something`,
})
export class Test6Comp {
  shortcutService = inject(ShortcutService)

  condition = true
  spy2: { handler: () => void }

  constructor() {
    this.spy2 = { handler: () => { } }
    spyOn(this.spy2, 'handler')
    registerShortcuts([
      {
        keys: 'a',
        func: this.spy2.handler,
      },
    ])
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}

@Component({
    imports: [Test6Comp],
    template: ` @if (visible) {<Test6Comp />}`
})
export class Test6 {
  shortcutService = inject(ShortcutService)

  visible = false
  @ViewChild(Test6Comp) child: Test6Comp
  spy1: { handler: () => void }

  constructor() {
    this.spy1 = { handler: () => { } }
    spyOn(this.spy1, 'handler')
    registerShortcuts([
      {
        keys: 'a',
        id: 'test',
        func: this.spy1.handler,
      },
    ])
  }

}

describe('ShortcutService -', () => {
  it('registers/removes a shortcut', keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test6)

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'a' })
    expect(component.spy1.handler).toHaveBeenCalledTimes(1)

    component.visible = true
    fixture.detectChanges()

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'a' })
    expect(component.child.spy2.handler).toHaveBeenCalledTimes(1)

    component.visible = false
    fixture.detectChanges()

    sendKeyAndDetectChanges(fixture, shortcuts, { name: 'a' })
    expect(component.spy1.handler).toHaveBeenCalledTimes(2)
  }))
})

@Component({
    imports: [H, FocusDirective],
    template: `<h #parent focus>
    <h #child focus></h>
  </h>
  `,
    providers: [ShortcutService]
})
export class Test7 {
  shortcutService = inject(ShortcutService)

  @ViewChild('parent', { read: ShortcutService }) parentShortcutService: ShortcutService
  @ViewChild('child', { read: ShortcutService }) childShortcutService: ShortcutService
}


describe('FocusDirective -', () => {
  it('provides a ShortcutService', keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(Test7)
    tick()
    expect(component.parentShortcutService._id).not.toEqual(component.childShortcutService._id)
    expect(component.shortcutService._id).not.toEqual(component.childShortcutService._id)
    expect(component.shortcutService._id).not.toEqual(component.parentShortcutService._id)
  }))
})

@Component({
    selector: 'component-data-display',
    imports: [H, List, ListItem, FocusDirective, StyleDirective],
    template: `
    <h [s]="cond(shortcutService.isFocused(), s.selected)"> {{ data().name }}</h>
    <list
      #list
      [items]="data()?.children"
      [focusName]="'list-' + data().name"
      [focusIf]="focused == 'children'"
      (selectedItem)="onSelectedItem($event)"
      [styleItem]="false"
      [s]="{ marginLeft: 1 }">
      <component-data-display
        *item="let item; type: data().children"
        [data]="item"
        focus
        [focusName]="'component-' + item.name"
        (selectedItem)="onSelectedItem($event)"/>
    </list>
  `
})
class ComponentDataView {
  shortcutService = inject(ShortcutService)

  readonly data = input({ name: 'name', children: [{ name: 'child1', children: [] }] });
  focused: 'self' | 'children' = 'self'
  canExpand = false
  expanded = false

  $selectedItem = signal(null)

  onSelectedItem(item) {
    this.$selectedItem.set(item)
    this.$$selectedItem.emit(item)
  }

  @Output('selectedItem') $$selectedItem = new EventEmitter()

  @ViewChild('list') list: List<any>
  @ViewChild('list', { read: ShortcutService }) listShortcutService: ShortcutService

  constructor() {
    registerShortcuts(this.shortcuts)
  }

  ngOnInit() {
    this.canExpand = !!this.data()?.children
  }

  shortcuts: Partial<Command>[] = [
    {
      keys: 'left',
      func: key => {
        if (this.focused == 'children') {
          this.focused = 'self'
        } else {
          if (this.expanded) {
            this.expanded = false
          } else {
            return key
          }
        }
      },
    },
    {
      keys: 'right',
      func: key => {
        if (!this.canExpand) return key

        if (this.focused == 'self') {
          if (!this.expanded) {
            this.expanded = true
          } else {
            this.focused = 'children'
          }
        } else if (this.focused == 'children') {
          return key
        }
      },
    },
    {
      keys: 'up',
      id: 'debugger.componentData.up',
      func: key => {
        if (this.focused == 'children') {
          this.focused = 'self'
        } else if (this.focused == 'self') {
          return key
        }
      },
    },
    {
      keys: 'down',
      id: 'debugger.componentData.down',
      func: key => {
        if (this.focused == 'self') {
          if (this.expanded) {
            this.focused = 'children'
          } else {
            return key
          }
        } else if (this.focused == 'children') {
          return key
        }
      },
    },
  ]


  s = {
    selected: { backgroundColor: 'gray' },
  }
  cond = cond

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}

describe('ComponentDataView -', () => {
  it('test', keyboardTest(() => {
    const { fixture, component, shortcuts } = setupTest(ComponentDataView)
    tick()
    expect(component.listShortcutService._id).toEqual(component.list.shortcutService._id)

    expect(component.shortcutService._id).not.toEqual(component.listShortcutService._id)
  }))
})

describe('removeLastMatch - ', () => {
  it('removes the last shortcut', () => {
    const res = removeLastMatch(['left', 'left',], 'left')
    expect(res).toEqual(['left'])
  })
})