import { NgFor } from '@angular/common'
import { Component, Input, Signal, computed, effect, signal } from '@angular/core'
import { Observable } from 'rxjs'
import { Logger } from '../../angular-terminal/logger'
import { KeyValue } from '../../utils/interfaces'
import { inputToSignal, longest } from '../../utils/utils'
import { GrowDirective, HBox, VBox } from '../1-basics/box'
import { ClassesDirective } from '../1-basics/classes'
import { List } from "./list/list"
import { blackOnWhite } from './styles'
import { ListItem } from './list/list-item'

@Component({
  standalone: true,
  selector: 'object-display',
  template: `
    <list [items]="$keyValues">
      <hbox *item="let keyValue; type: $keyValues()">
      <h
          [style]="{ flexShrink: 0, width: $longestKey() + 1, vgrow: true }"
          [classes]="[s.blackOnWhite]"
          >{{ keyValue.key }}</h
        >
        <h [style]="{ wrap: 'wrap' }">{{ keyValue.value }}</h>
      </hbox>
    </list>
  `,
  imports: [GrowDirective, HBox, ClassesDirective, NgFor, VBox, List, ListItem]
})
export class ObjectDisplay<T> {
  @Input() object: T | Observable<T> | Signal<T>
  $object = signal({})
  $keyValues = computed(() => {
    const object = this.$object()
    return Object.entries(object).map(([key, value]) => {
      if (typeof value == 'string') {
        return { key, value }
      } else {
        return { key, value }
      }
    })
  })
  $longestKey = computed(() => longest(this.$keyValues()))
  trackByFn = (index, keyValue: KeyValue) => keyValue.key

  constructor(public logger: Logger) {
    inputToSignal(this, 'object', '$object')
  }

  s = {
    blackOnWhite: blackOnWhite,
  }
}
