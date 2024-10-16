import { CommonModule } from '@angular/common'
import { Component, inject, signal } from '@angular/core'
import { Command, GrowDirective, HBox, HGrowDirective, List, ListItem, StyleDirective, TextInput, VBox, derived, registerShortcuts, } from '@rectangulr/rectangulr'
import { NotificationsService } from '@rectangulr/rectangulr'

@Component({
  template: `
      <v grow>
        <h [s]="s.title">Todo App</h>
        <text-input [(text)]="selectedTodo" />
        <list [items]="items" (selectedIndex)="selectedIndex.set($event)" >
          <h *item="let item">{{ item }}</h>
        </list>
      </v>
  `,
  hostDirectives: [GrowDirective],
  standalone: true,
  imports: [CommonModule, HBox, VBox, GrowDirective, HGrowDirective, List, ListItem, StyleDirective, TextInput],
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

  selectedIndex = signal(0)
  selectedTodo = derived(() => this.items()[this.selectedIndex()], value => {
    this.items.update(items => {
      items[this.selectedIndex()] = value
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
          return items.filter((_, i) => i !== this.selectedIndex())
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
