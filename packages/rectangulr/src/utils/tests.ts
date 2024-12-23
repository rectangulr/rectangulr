import { Type } from '@angular/core'
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, flush, tick } from '@angular/core/testing'
import { Key } from '../commands/keypress-parser'
import { ShortcutService } from '../commands/shortcut.service'

export function setupTest<T>(componentClass: Type<T>) {
  TestBed.resetTestingModule()
  TestBed.configureTestingModule({
    providers: [ShortcutService],
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