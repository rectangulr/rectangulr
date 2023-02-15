import { NgIf } from '@angular/common'
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core'
import json5 from 'json5'
import { Subject } from 'rxjs'
import { Logger } from '../../../angular-terminal/logger'
import { FocusDebugDirective, FocusDirective } from '../../../commands/focus.directive'
import { Command, registerShortcuts, ShortcutService } from '../../../commands/shortcut.service'
import { assert, removeFromArray } from '../../../utils/utils'
import { Box } from '../../1-basics/box'
import { NewClassesDirective } from '../../1-basics/classes'
import { StyleDirective } from '../../1-basics/style'
import { TextInput } from '../../1-basics/text-input'
import { List, selectItem } from '../list/list'
import { ListItem } from '../list/list-item'

@Component({
  standalone: true,
  selector: 'json-editor',
  host: { '[style]': "{flexDirection: 'row'}" },
  template: `
    <box
      *ngIf="keyValue.key != null"
      [focusIf]="focused == 'key'"
      [style]="{
        flexDirection: 'row',
        alignItems: 'flexStart'
      }">
      <text-input [(text)]="keyValue.key"></text-input>:
    </box>

    <ng-container [focusIf]="focused == 'value'">
      <ng-container *ngIf="['string', 'number', 'boolean', 'null'].includes(type)">
        <text-input [(text)]="keyValue.value"></text-input>
      </ng-container>
      <ng-container *ngIf="type == 'object' || type == 'array'">
        <list [items]="childrenKeyValues">
          <json-editor
            *item="let kv; type: childrenKeyValues"
            focus
            [keyValue]="kv"
            [newclasses]="[isRoot(), { paddingLeft: 2 }]"></json-editor>
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
    NewClassesDirective,
  ],
  providers: [ShortcutService],
})
export class JsonEditor {
  @Input() value = null
  @Input() keyValue: KeyValue = null
  @Input() path: string[] = []

  @Output() submit = new EventEmitter()

  type: Type = 'object'
  childrenKeyValues: KeyValue[] = []
  focused: 'key' | 'value' = 'key'

  @ViewChild(List) list: List<any>

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

    this.focused = this.keyValue.key != null ? 'key' : 'value'

    if (this.hasChildren()) {
      this.childrenKeyValues = Object.entries(this.keyValue.value).map(([key, value]) => ({
        key: key,
        value: value,
      }))
    }

    if (this.hasChildren()) {
      registerShortcuts(this, this.shortcutsForArrayOrObject)
    } else {
      registerShortcuts(this, this.shortcutsForKeyValues)
    }

    this.shortcutService.requestFocus()
  }

  /**
   * Creates a javascript object from the json-editor.
   */
  getValue(): any {
    if (this.hasChildren()) {
      return getValueFromKVs(this.childrenKeyValues)
    } else {
      return this.keyValue.value
    }
  }

  concat(...paths) {
    return [...paths]
  }

  isRoot() {
    return this.value
  }

  private createNewLine() {
    const newKV = { key: '', value: '' }
    this.childrenKeyValues.push(newKV)
    selectItem(this.list, newKV)
  }

  private hasChildren() {
    return this.type == 'object' || this.type == 'array'
  }

  /**
   * Shortcuts registered only if editing a value (string, number, boolean, null)
   */
  shortcutsForKeyValues: Partial<Command>[] = [
    {
      keys: 'backspace',
      func: key => {
        if (this.focused == 'value') this.focused = 'key'
        else if (this.focused == 'key') return key
      },
    },
    {
      keys: ['left', 'ctrl+left', 'shift+tab', 'home'],
      func: key => {
        if (this.focused == 'value') this.focused = 'key'
        else if (this.focused == 'key') return key
      },
    },
    {
      keys: ['right', 'ctrl+right', 'tab', 'end'],
      func: key => {
        if (this.focused == 'key') this.focused = 'value'
        else if (this.focused == 'value') return key
      },
    },
  ]
  /**
   * Shortcuts registered only if editing an object or array
   */
  shortcutsForArrayOrObject: Partial<Command>[] = [
    {
      keys: ['enter', 'tab'],
      func: () => {
        this.createNewLine()
      },
    },
    {
      keys: ['left', 'ctrl+left', 'shift+tab', 'home'],
      func: () => {
        this.list.selectIndex(this.list.selected.index - 1)
      },
    },
    {
      keys: ['right', 'ctrl+right', 'end'],
      func: () => {
        this.list.selectIndex(this.list.selected.index + 1)
      },
    },
    {
      keys: 'backspace',
      func: () => {
        this.childrenKeyValues = removeFromArray(this.childrenKeyValues, this.list.selected.value)
        this.list.selectIndex(this.list.selected.index - 1)
      },
    },
  ]

  toString() {
    const keyValue = json5.stringify(this.keyValue)
    return `JsonEditor: ${keyValue}`
  }

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

function getValueFromKVs(keyValues: KeyValue[]) {
  if (valueHasChildren(keyValues)) {
    const recursedKVs = keyValues.map(kv => [kv.key, getValueFromKVs(kv.value)])
    return Object.fromEntries(recursedKVs)
  } else {
    return keyValues
  }
}
