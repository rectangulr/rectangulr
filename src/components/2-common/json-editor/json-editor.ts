import { NgIf } from '@angular/common'
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core'
import json5 from 'json5'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { Logger } from '../../../angular-terminal/logger'
import { FocusDebugDirective, FocusDirective } from '../../../commands/focus.directive'
import { Command, registerShortcuts, ShortcutService } from '../../../commands/shortcut.service'
import { DataFormat } from '../../../utils/data-format'
import { Anything, assert, removeFromArray } from '../../../utils/utils'
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
      *ngIf="valueRef.key != null"
      [focusIf]="focused == 'key'"
      [style]="{
        flexDirection: 'row',
        alignItems: 'flexStart'
      }">
      <text-input [(text)]="valueRef.key"></text-input>:
    </box>

    <ng-container [focusIf]="focused == 'value'">
      <text-input
        *ngIf="['string', 'number', 'boolean', 'null'].includes(valueRef.type)"
        [text]="valueText"
        (textChange)="textChange($event)"></text-input>
      <ng-container *ngIf="valueRef.type == 'object' || valueRef.type == 'array'">
        <list [items]="childrenValueRefs">
          <json-editor
            *item="let ref; type: childrenValueRefs"
            focus
            [valueRef]="ref"
            [isRoot]="false"
            [newclasses]="[[isRoot, { paddingLeft: 2 }]]"></json-editor>
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
  @Input() valueRef: ValueRef = { key: null, value: null, type: 'null' }
  @Input() dataFormat: DataFormat | undefined = null
  @Input() path: string[] = []
  @Input() isRoot = true

  @Output() submit = new EventEmitter()

  childrenValueRefs: ValueRef[] = []
  focused: 'key' | 'value' = 'key'
  valueText: string = ''

  @ViewChild(List) list: List<any>

  constructor(public shortcutService: ShortcutService, public logger: Logger) {}

  async ngOnInit() {
    // assert(!(this.value && this.valueRef), 'Use [value] or [keyValue]. Not both.')

    if (this.isRoot) {
      if (this.value) {
        this.valueRef = { key: null, value: this.value, type: typeFromValue(this.value) }
      } else if (this.dataFormat) {
        const expandedValue = await this.dataFormat.completions()
        this.valueRef = { key: null, value: expandedValue, type: typeFromValue(expandedValue) }
      } else {
        assert(false)
      }
    }

    this.focused = this.valueRef.key != null ? 'key' : 'value'

    if (this.hasChildren()) {
      this.childrenValueRefs = Object.entries(this.valueRef.value).map(([key, value]) => ({
        key: key,
        value: value,
        type: typeFromValue(value),
      }))
    } else {
      this.valueText = textFromValue(this.valueRef.value)
    }

    if (this.hasChildren()) {
      registerShortcuts(this, this.shortcutsForArrayOrObject)
    } else {
      registerShortcuts(this, this.shortcutsForKeyValues)
    }

    this.shortcutService.requestFocus()
  }

  textChange(text: string) {
    this.valueText = text
    this.valueRef.value = valueFromText(text)
  }

  /**
   * Creates a javascript object from the json-editor.
   */
  getValue(): Anything {
    if (this.hasChildren()) {
      return getValueFromKVs(this.childrenValueRefs)
    } else {
      return this.valueRef.value
    }
  }

  concat(...paths) {
    return [...paths]
  }

  private createNewLine() {
    const newKV = { key: '', value: '', type: 'string' }
    this.childrenValueRefs.push(newKV)
    selectItem(this.list, newKV)
  }

  private hasChildren() {
    return this.valueRef.type == 'object' || this.valueRef.type == 'array'
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
        if (this.list.selected.index == this.list.$items.value.length - 1) {
          this.createNewLine()
        } else {
          this.list.selectIndex(this.list.selected.index + 1)
        }
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
        this.childrenValueRefs = removeFromArray(this.childrenValueRefs, this.list.selected.value)
        this.list.selectIndex(this.list.selected.index - 1)
      },
    },
  ]

  toString() {
    const keyValue = json5.stringify(this.valueRef)
    return `JsonEditor: ${keyValue}`
  }

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}

function valueFromText(text: string): any {
  const jsonNumber = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/gm
  if (text == 'false') {
    return false
  } else if (text == 'true') {
    return true
  } else if (text == 'null') {
    return null
  } else if (jsonNumber.test(text)) {
    const number = Number(text)
    if (_.isNaN(number)) debugger
    return number
  } else {
    return text
  }
}

function textFromValue(value: any): string {
  return String(value)
}

function typeFromValue(value: any) {
  let type: string = typeof value
  if (value == null) type = 'null'
  else if (Array.isArray(value)) type = 'array'
  return type
}

export interface ValueRef {
  key?: string
  value: any
  type: string
}

function valueHasChildren(value: any): value is any[] {
  return value && (typeof value == 'object' || Array.isArray(value))
}

function getValueFromKVs(keyValues: ValueRef | ValueRef[] | string | number) {
  if (valueHasChildren(keyValues)) {
    const recursedKVs = keyValues.map(kv => [kv.key, getValueFromKVs(kv.value)])
    return Object.fromEntries(recursedKVs)
  } else {
    return keyValues
  }
}
