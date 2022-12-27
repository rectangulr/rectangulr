import { Component, EventEmitter, Input, Output } from '@angular/core'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { Command, registerShortcuts, ShortcutService } from '../../../commands/shortcut.service'
import { subscribe } from '../../../utils/reactivity'

export interface KeyValue {
  key: string
  value: any
}

@Component({
  selector: 'json-editor',
  template: `
    <ng-container *ngIf="['string', 'number', 'boolean', 'null'].includes(type)">
      <text-input [(text)]="value"></text-input>
    </ng-container>

    <ng-container *ngIf="type == 'object' || type == 'array'">
      <box
        *ngFor="let keyValue of keyValues"
        focus
        [style]="{ flexDirection: 'row', alignItems: 'flexStart' }">
        <box
          [style]="{
            backgroundColor: 'darkgray',
            flexDirection: 'row',
            alignItems: 'flexStart'
          }">
          <text-input [(text)]="keyValue.key" [focusIf]="focusedPart == 'left'"></text-input>:</box
        ><json-editor
          [value]="keyValue.value"
          [path]="concat(path, keyValue.key)"
          [focusIf]="focusedPart == 'right'"
          [$retrieveValue]="$retrieveChildrenValue"
          (newValue)="handleNewValue($event)"
          [style]="{ paddingLeft: 2 }"></json-editor>
      </box>
    </ng-container>
  `,
})
export class JsonEditor {
  @Input() value = null
  @Input() path: string[] = []
  @Output() newValue = new EventEmitter<KeyValue>()

  @Input() $retrieveValue: EventEmitter<null> = null
  $retrieveChildrenValue = new EventEmitter()

  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' = 'object'
  keyValues: KeyValue[]
  focusedPart: 'left' | 'right' = 'left'
  childrenKeyValues: KeyValue[] = []
  hasChildren = false

  constructor(public shortcutService: ShortcutService) {}

  ngOnInit() {
    //@ts-ignore
    this.type = typeof this.value
    if (this.value == null) this.type = 'null'
    this.hasChildren = this.type == 'object' || this.type == 'array'

    if (this.hasChildren) {
      this.keyValues = Object.entries(this.value).map(([key, value]) => ({
        key: key,
        value: value,
      }))
    }

    if (this.$retrieveValue) {
      subscribe(this, this.$retrieveValue, () => {
        this.emitValue()
      })
    }

    registerShortcuts(this, this.shortcuts)
    if (this.isRoot()) {
      registerShortcuts(this, [
        {
          keys: 'enter',
          id: 'submitValue',
          func: () => {
            this.emitValue()
          },
        },
      ])
    }
  }

  emitValue() {
    const value = this.hasChildren ? this.valueChildren() : this.value
    const keyValue = { key: _.last(this.path), value: value }
    this.newValue.emit(keyValue)
  }

  valueChildren() {
    // Reset accumulator
    this.childrenKeyValues = []

    // Tell children to send up their respective value
    this.$retrieveChildrenValue.emit(null)

    // Get result
    if (this.type == 'object') {
      return Object.fromEntries(this.childrenKeyValues.map(kv => [kv.key, kv.value]))
    } else if (this.type == 'array') {
      const size = _.max(this.keyValues.map(kv => Number(kv.key)))
      const array = new Array(size)
      this.keyValues.forEach(kv => {
        array[kv.key] = kv.value
      })
      return array
    }
  }

  handleNewValue(keyValue: KeyValue) {
    this.childrenKeyValues.push(keyValue)
  }

  concat(...paths) {
    return [...paths]
  }

  private isRoot() {
    return this.path.length == 0
  }

  shortcuts: Partial<Command>[] = [
    {
      keys: 'tab',
      func: key => {
        if (this.hasChildren) {
          if (this.focusedPart == 'left') {
            this.focusedPart = 'right'
          } else if (this.focusedPart == 'right') {
            this.keyValues.push({ key: '', value: '' })
            this.focusedPart = 'left'
          }
        } else {
          return key
        }
      },
    },
    {
      keys: 'shift+tab',
      func: key => {
        if (this.focusedPart == 'left') {
          return key
        } else if (this.focusedPart == 'right') {
          this.focusedPart = 'left'
        }
      },
    },
  ]

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
