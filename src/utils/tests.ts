import { Type } from '@angular/core'
import { ComponentFixture, flush, TestBed, tick } from '@angular/core/testing'
import { Logger } from '../angular-terminal/logger'
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

  return { fixture, shortcuts, component }
}

export function sendKeyAndDetectChanges(
  fixture: ComponentFixture<any>,
  shortcuts: ShortcutService,
  key: Partial<Key>
) {
  shortcuts.incomingKey({ key: key })

  // TestBed.inject(Logger).log('detectChanges')
  fixture?.detectChanges()

  // TestBed.inject(Logger).log('tick')
  tick()
}
