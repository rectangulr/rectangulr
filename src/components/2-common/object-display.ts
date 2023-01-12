import { Component, Input } from '@angular/core'
import * as json5 from 'json5'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { Logger } from '../../angular-terminal/logger'
import { KeyValue } from '../../utils/interfaces'
import { State } from '../../utils/reactivity'
import { longest, stringifyReplacer } from '../../utils/utils'
import { blackOnWhite } from './styles'

@Component({
  selector: 'object-display',
  template: `
    <box [style]="{ flexDirection: 'row' }" *ngFor="let keyValue of keyValues; trackBy: trackByFn">
      <box [style]="{ flexShrink: 0, width: longestKey + 1 }" [classes]="[blackOnWhite]">{{
        keyValue.key
      }}</box>
      <box>{{ keyValue.value }}</box>
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
        if (_.isPlainObject(value)) {
          return { key, value: json5.stringify(value, stringifyReplacer()) }
        }
        return { key, value }
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
