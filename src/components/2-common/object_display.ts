import { Component, Input } from '@angular/core'
import * as json5 from 'json5'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { Logger } from '../../angular-terminal/logger'
import { State } from '../../lib/reactivity'
import { longest } from '../../lib/utils'
import { blackOnWhite } from './styles'

@Component({
  selector: 'object-display',
  template: `
    <box [style]="{ flexDirection: 'row' }" *ngFor="let keyValue of keyValues">
      <box [style]="{ width: longestKey + 1 }" [classes]="[blackOnWhite]">{{ keyValue.key }}</box>
      <box>{{ keyValue.value }}</box>
    </box>
  `,
})
export class ObjectDisplay {
  @Input() set object(object) {
    this._object.subscribeSource(object)
  }
  _object: State<any>
  keyValues: { key: string; value: any }[]
  longestKey = 0

  constructor(public logger: Logger) {
    this._object = new State('', this.destroy$)
    this._object.$.subscribe(object => {
      if (!object) {
        object = {}
      }
      this.keyValues = Object.entries(object).map(([key, value]) => {
        if (_.isPlainObject(value)) {
          return { key, value: json5.stringify(value) }
        }
        return { key, value }
      })
      this.longestKey = longest(this.keyValues)
    })
  }

  blackOnWhite = blackOnWhite

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
