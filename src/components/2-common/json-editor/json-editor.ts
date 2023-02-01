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
    <box
      *ngIf="keyValue.key"
      [focusIf]="focused == 'key'"
      [style]="{
        backgroundColor: 'darkgray',
        flexDirection: 'row',
        alignItems: 'flexStart'
      }">
      <text-input [(text)]="keyValue.key"></text-input>:</box
    >

    <ng-container [focusIf]="focused == 'value'">
      <ng-container *ngIf="['string', 'number', 'boolean', 'null'].includes(type)">
        <text-input [(text)]="keyValue.value"></text-input>
      </ng-container>
      <ng-container *ngIf="type == 'object' || type == 'array'">
        <list [items]="childrenKeyValues">
          <box
            focus
            *item="let kv; type: childrenKeyValues"
            [style]="{ flexDirection: 'row', alignItems: 'flexStart' }">
            <json-editor [keyValue]="kv" [style]="{ paddingLeft: 2 }"></json-editor>
          </box>
        </list>
      </ng-container>
    </ng-container>
  `,
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
  childrenKeyValues: KeyValue[] = []
  focused: 'key' | 'value' = 'key'

  constructor(public shortcutService: ShortcutService, public logger: Logger) {}

  ngOnInit() {
    assert(!(this.value && this.keyValue), 'Use [value] or [keyValue]. Not both.')
    if (this.value) {
      this.keyValue = { key: null, value: this.value }
    }

    //@ts-ignore
    this.type = typeof this.keyValue.value
    if (this.keyValue.value == null) this.type = 'null'
    else if (Array.isArray(this.keyValue.value)) this.type = 'array'

    this.focused = this.keyValue.key ? 'key' : 'value'

    if (typeHasChildren(this.type)) {
      this.childrenKeyValues = Object.entries(this.keyValue.value).map(([key, value]) => ({
        key: key,
        value: value,
      }))
    }

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
    if (typeHasChildren(this.type)) {
      return getValueFromKVs(this.childrenKeyValues)
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
        if (this.focused == 'key') {
          this.focused = 'value'
        } else if (this.focused == 'value' && typeHasChildren(this.type)) {
          this.childrenKeyValues.push({ key: '', value: '' })
          this.focused = 'key'
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

function typeHasChildren(type: Type) {
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
