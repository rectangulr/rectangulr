import { Type } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Key } from '../commands/keypress-parser'
import { ShortcutService } from '../commands/shortcut.service'
import { async } from './utils'

export async function setupTest<T>(componentClass: Type<T>) {
  TestBed.resetTestingModule()
  TestBed.configureTestingModule({
    providers: [ShortcutService],
  })

  const fixture: ComponentFixture<T> = TestBed.createComponent(componentClass)
  const component: T = fixture.componentInstance

  await async(() => fixture.detectChanges())
  const shortcuts = TestBed.inject(ShortcutService)

  return {
    fixture,
    shortcuts,
    component,
  }
}

export async function sendKeyAndDetectChanges(
  fixture: ComponentFixture<any>,
  shortcuts: ShortcutService,
  key: Partial<Key>
) {
  shortcuts.incomingKey({ key: key })
  return async(() => fixture.detectChanges())
}
