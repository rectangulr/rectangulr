import { NgFor } from '@angular/common'
import { Component, Input } from '@angular/core'
import * as json5 from 'json5'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { Logger } from '../../angular-terminal/logger'
import { KeyValue } from '../../utils/interfaces'
import { State } from '../../utils/reactivity'
import { longest, stringifyReplacer } from '../../utils/utils'
import { Box } from '../1-basics/box'
import { ClassesDirective } from '../1-basics/classes'
import { blackOnWhite } from './styles'

@Component({
  standalone: true,
  imports: [Box, ClassesDirective, NgFor],
  selector: 'object-display',
  template: `
    <box
      [style]="{ flexDirection: 'row', scroll: 'y' }"
      *ngFor="let keyValue of keyValues; trackBy: trackByFn">
      <box [style]="{ flexShrink: 0, width: longestKey + 1 }" [classes]="[blackOnWhite]">{{
        keyValue.key
      }}</box>
      <box [style]="{ wrap: 'wrap' }">{{ keyValue.value }}</box>
    </box>
  `,
})
export class ObjectDisplay {
  @Input() set object(object) {
    this._object.subscribeSource(object)
  }
  _object: State<any>
  keyValues: KeyValue[]
  longestKey = 0
  trackByFn = (index, keyValue: KeyValue) => keyValue.key

  constructor(public logger: Logger) {
    this._object = new State('', this.destroy$)
    this._object.$.subscribe(object => {
      if (!object) {
        object = {}
      }
      this.keyValues = Object.entries(object).map(([key, value]) => {
        if (typeof value == 'string') {
          return { key, value }
        } else {
          return { key, value: json5.stringify(value, stringifyReplacer()) }
        }
      })
      this.longestKey = longest(this.keyValues)
    })
  }

  blackOnWhite = blackOnWhite

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
