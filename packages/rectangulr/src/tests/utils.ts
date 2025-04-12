import { NO_ERRORS_SCHEMA, Type } from '@angular/core'
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing'
import { TermElement } from '../angular-terminal/dom-terminal'
import { LOGGER } from '../angular-terminal/logger'
import { Key } from '../commands/keypress-parser'
import { ShortcutService } from '../commands/shortcut.service'

export function setupTest<T>(componentClass: Type<T>) {
  TestBed.resetTestingModule()
  TestBed.configureTestingModule({
    providers: [
      ShortcutService,
      { provide: LOGGER, useValue: { log: () => { } } }
    ],
    schemas: [NO_ERRORS_SCHEMA]
  })

  const fixture: ComponentFixture<T> = TestBed.createComponent(componentClass)
  const component: T = fixture.componentInstance
  const shortcuts = TestBed.inject(ShortcutService)

  fixture.detectChanges()
  // @ts-ignore
  if (Zone.current.get('FakeAsyncTestZoneSpec')) {
    tick()
  }

  return { fixture, shortcuts, component }
}

export function sendKeyAndDetectChanges(
  fixture: ComponentFixture<any>,
  shortcuts: ShortcutService,
  key: Partial<Key>
) {
  fixture?.detectChanges()
  TestBed.flushEffects()
  tick()

  // TestBed.inject(LOGGER).log('tick')
  shortcuts.incomingKey({ key: key })

  fixture?.detectChanges()
  TestBed.flushEffects()
  tick()
}

export function keyboardTest(func: () => void) {
  return fakeAsync(() => {
    func()
    tick()
    discardPeriodicTasks()
  })
}

export function renderToAnsiCodes(comp: any) {
  const fixture = TestBed.createComponent(comp)
  const el: TermElement = fixture.elementRef.nativeElement
  fixture.detectChanges()
  el.rootNode.render('full', el.rootNode.frame)
  return el.rootNode.frame.renderAnsiCodes('full')
}

export function renderToPlainText(comp: any) {
  const fixture = TestBed.createComponent(comp)
  const el: TermElement = fixture.elementRef.nativeElement
  fixture.detectChanges()
  el.rootNode.updateDirtyNodes()
  el.rootNode.render('full', el.rootNode.frame)
  return el.rootNode.frame.renderToPlainText()
}
