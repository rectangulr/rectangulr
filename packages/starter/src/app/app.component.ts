import { Component, inject, signal } from '@angular/core'
import { Command, Grow, H, List, NotificationsService, Style, TextInput, VGrow, derived, registerShortcuts } from '@rectangulr/rectangulr'
import * as _ from '@s-libs/micro-dash'
import { signal2 } from '../utils/Signal2'

@Component({
  template: `
      <h [s]="s.title">Todo App</h>
      <text-input [(text)]="selectedTodo" />
      <list [items]="items()" (selectedIndex)="selectedIndex.set($event)"/>
  `,
  hostDirectives: [Grow],
  standalone: true,
  imports: [H, List, Style, TextInput],
})
export class AppComponent {
  notificationService = inject(NotificationsService)

  constructor() {
    registerShortcuts(this.shortcuts)
  }

  items = signal([
    'first thing to do',
    'second thing to do',
    'third thing to do',
    'last thing to do',
  ])

  selectedIndex = signal2<number | undefined>(undefined)

  selectedTodo = derived<string>(() => {
    const items = this.items()
    if (_.isNil(this.selectedIndex.$) || this.selectedIndex.$ > items.length) {
      return ''
    }
    return items[this.selectedIndex.$]
  }, value => {
    this.items.update(items => {
      if (_.isNil(this.selectedIndex.$)) return items
      items[this.selectedIndex.$] = value
      return [...items]
    })
  })

  shortcuts: Partial<Command>[] = [
    {
      keys: 'alt+n', id: 'new', func: () => {
        this.items.update(items => ['new item', ...items])
        this.selectedIndex.set(0)
      }
    },
    {
      keys: 'alt+d', id: 'delete', func: () => {
        this.items.update(items => {
          const removed = items.filter((_, i) => i !== this.selectedIndex())
          // Always at least one todo
          if (removed.length == 0) return ['new item']
          return removed
        })
        this.notificationService.notify({
          name: 'Deleted todo'
        })
      },
    }
  ]

  s = {
    title: { hgrow: true, backgroundColor: 'gray' },
  }
}
