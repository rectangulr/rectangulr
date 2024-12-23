
import { Component, Signal, computed, effect, signal, input, inject } from '@angular/core'
import { Observable } from 'rxjs'
import { LOGGER } from '../../angular-terminal/logger'
import { KeyValue } from '../../utils/interfaces'
import { inputToSignal, longest } from '../../utils/utils'
import { GrowDirective, HBox, VBox } from '../1-basics/box'
import { List } from "./list/list"
import { blackOnWhite } from './styles'
import { ListItem } from './list/list-item'
import { StyleDirective } from '../1-basics/style'

@Component({
  standalone: true,
  selector: 'object-display',
  template: `
    <list [items]="keyValues()">
      <h *item="let keyValue; type: keyValues()">
        <h
          [s]="{ flexShrink: 0, width: longestKey() + 1, vgrow: true }"
          [s]="[s.blackOnWhite]"
          >{{ keyValue.key }}</h
        >
        <h [s]="{ wrap: 'wrap' }">{{ keyValue.value }}</h>
      </h>
    </list>
  `,
  imports: [HBox, List, ListItem, StyleDirective]
})
export class ObjectDisplay<T> {
  readonly object = input<T | Observable<T> | Signal<T>>(undefined)

  keyValues = computed(() => {
    const object = this.object() || {}
    return Object.entries(object).map(([key, value]) => {
      if (typeof value == 'string') {
        return { key, value }
      } else {
        return { key, value }
      }
    })
  })

  longestKey = computed(() => longest(this.keyValues()))

  trackByFn = (index, keyValue: KeyValue) => keyValue.key

  logger = inject(LOGGER)

  s = {
    blackOnWhite: blackOnWhite,
  }
}
