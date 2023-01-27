import { NgIf } from '@angular/common'
import { Component, Input } from '@angular/core'
import { Subject } from 'rxjs'
import { Logger } from '../../../angular-terminal/logger'
import { FocusDebugDirective, FocusDirective } from '../../../commands/focus.directive'
import { Command, registerShortcuts, ShortcutService } from '../../../commands/shortcut.service'
import { assert } from '../../../utils/utils'
import { Box } from '../../1-basics/box'
import { StyleDirective } from '../../1-basics/style'
import { TextInput } from '../../1-basics/text-input'
import { List } from '../list/list'
import { ListItem } from '../list/list-item'

@Component({
  standalone: true,
  selector: 'json-editor',
  template: `
    <!-- <ng-container *ngIf="['string', 'number', 'boolean', 'null'].includes(type)">
      <text-input [(text)]="keyValue.value"></text-input>
    </ng-container> -->

    <ng-container *ngIf="type == 'object' || type == 'array'">
      <list [items]="keyValues">
        <box
          *item="let keyValue; type: keyValues"
          focus
          [style]="{ flexDirection: 'row', alignItems: 'flexStart' }">
          <box
            [style]="{
              backgroundColor: 'darkgray',
              flexDirection: 'row',
              alignItems: 'flexStart'
            }">
            <text-input [(text)]="keyValue.key" [focusIf]="focused == 'key'"></text-input>:</box
          >
        </box>
      </list>
    </ng-container>
  `,
  // <json-editor
  // [keyValue]="keyValue"
  // [focusIf]="focused == 'value'"
  // [style]="{ paddingLeft: 2 }"></json-editor>
  imports: [
    Box,
    TextInput,
    NgIf,
    List,
    ListItem,
    FocusDirective,
    FocusDebugDirective,
    StyleDirective,
  ],
})
export class JsonEditor {
  @Input() value = null
  @Input() keyValue: KeyValue = null
  @Input() path: string[] = []

  type: Type = 'object'
  keyValues: KeyValue[] = []
  focused: 'key' | 'value' = 'key'

  constructor(public shortcutService: ShortcutService, public logger: Logger) {}

  updateKey(event) {
    this.keyValue.key = event
  }

  updateValue(event) {
    this.keyValue.value = event
  }

  ngOnInit() {
    assert(!(this.value && this.keyValue), 'Use [value] or [keyValue]. Not both.')
    if (this.value) {
      this.keyValue = { key: null, value: this.value }
    }

    //@ts-ignore
    this.type = typeof this.keyValue.value
    if (this.keyValue.value == null) this.type = 'null'
    else if (Array.isArray(this.keyValue.value)) this.type = 'array'

    if (hasChildren(this.type)) {
      this.keyValues = Object.entries(this.keyValue.value).map(([key, value]) => ({
        key: key,
        value: value,
      }))
    }

    this.logger.log({ message: 'ngOnInit JsonEditor', type: this.type, focused: this.focused })

    registerShortcuts(this, this.shortcuts)
    if (this.isRoot()) {
      registerShortcuts(this, [
        {
          keys: 'enter',
          id: 'submitValue',
          func: () => {},
        },
      ])
    }
  }

  /**
   * Creates a javascript object from the json-editor.
   */
  getValue(): any {
    if (this.keyValue.key) {
      return getValueFromKVs(this.keyValues)
    } else {
      return this.keyValue.value
    }
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
        if (hasChildren(this.type)) {
          if (this.focused == 'key') {
            this.focused = 'value'
          } else if (this.focused == 'value') {
            this.keyValues.push({ key: '', value: '' })
            this.focused = 'key'
          }
        } else {
          return key
        }
      },
    },
    {
      keys: 'shift+tab',
      func: key => {
        if (this.focused == 'key') {
          return key
        } else if (this.focused == 'value') {
          this.focused = 'key'
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

export interface KeyValue {
  key: string
  value: any
}

function valueHasChildren(value: any) {
  return value && (typeof value == 'object' || Array.isArray(value))
}

type Type = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'

function hasChildren(type: Type) {
  return type == 'object' || type == 'array'
}

function getValueFromKVs(keyValues: KeyValue[]) {
  if (valueHasChildren(keyValues)) {
    const recursedKVs = keyValues.map(kv => [kv.key, getValueFromKVs(kv.value)])
    return Object.fromEntries(recursedKVs)
  } else {
    return keyValues
  }
}
