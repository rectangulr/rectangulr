import { NgIf } from '@angular/common'
import { Component, Input, ViewChild } from '@angular/core'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import json5 from 'json5'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { Logger } from '../../../angular-terminal/logger'
import { FocusDebugDirective, FocusDirective } from '../../../commands/focus.directive'
import { Command, ShortcutService, registerShortcuts } from '../../../commands/shortcut.service'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
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
      *ngIf="hasKey()"
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
        <list
          [items]="valueRef.childrenValueRefs"
          onItemsChangeSelect="same"
          [focusShortcuts]="shortcutsForList">
          <json-editor
            *item="let ref; type: valueRef.childrenValueRefs"
            focus
            [valueRef]="ref"
            [isRoot]="false"
            [newclasses]="[[!isRoot, { paddingLeft: 2 }]]"></json-editor>
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
  providers: [
    ShortcutService,
    {
      provide: NG_VALUE_ACCESSOR,
      useFactory: (json: JsonEditor) => json.controlValueAccessor,
      deps: [JsonEditor],
      multi: true,
    },
  ],
})
export class JsonEditor {
  @Input() data = null
  @Input() valueRef: ValueRef = { key: null, value: null, type: 'null', childrenValueRefs: [] }
  @Input() dataFormat: DataFormat | undefined = null
  @Input() path: string[] = []
  @Input() isRoot = true

  focused: 'key' | 'value' = 'key'
  valueText: string = ''

  controlValueAccessor = new BaseControlValueAccessor()
  @ViewChild(List) list: List<any>

  constructor(public shortcutService: ShortcutService, public logger: Logger) {}

  async ngOnInit() {
    // assert(!(this.value && this.valueRef), 'Use [value] or [valueRef]. Not both.')

    if (this.isRoot) {
      if (this.data !== undefined) {
        this.valueRef = {
          key: null,
          value: this.data,
          type: typeFromValue(this.data),
        }
      } else if (this.dataFormat) {
        const expandedValue = await this.dataFormat.completions()
        this.valueRef = { key: null, value: expandedValue, type: typeFromValue(expandedValue) }
      } else {
        assert(false)
      }
    }

    this.focused = this.hasKey() ? 'key' : 'value'

    if (this.valueRef.type == 'object') {
      this.valueRef.childrenValueRefs = Object.entries(this.valueRef.value).map(([key, value]) => ({
        key: key,
        value: value,
        type: typeFromValue(value),
      }))
    } else if (this.valueRef.type == 'array') {
      this.valueRef.childrenValueRefs = Object.entries(this.valueRef.value).map(([key, value]) => ({
        key: null,
        value: value,
        type: typeFromValue(value),
      }))
    } else {
      this.valueText = textFromValue(this.valueRef.value)
    }

    registerShortcuts(this, this.shortcuts)

    this.shortcutService.requestFocus()
  }

  textChange(text: string) {
    this.valueText = text
    this.valueRef.value = valueFromText(text)
  }

  /**
   * Creates a javascript object from the json-editor.
   */
  getValue(): Anything | string | null | number {
    return getValueFromRef(this.valueRef)
  }

  hasKey() {
    return this.valueRef.key != null
  }

  concat(...paths) {
    return [...paths]
  }

  createNewLine() {
    var newValueRef
    if (this.valueRef.type == 'object') {
      newValueRef = { key: '', value: '', type: 'string' }
    } else if (this.valueRef.type == 'array') {
      newValueRef = { key: null, value: '', type: 'string' }
    }
    this.valueRef.childrenValueRefs.push(newValueRef)
    selectItem(this.list, newValueRef)
  }

  /**
   * Shortcuts
   */
  shortcuts: Partial<Command>[] = [
    {
      keys: 'backspace',
      func: key => {
        if (this.focused == 'value') {
          if (this.hasKey()) {
            this.focused = 'key'
          } else {
            return key
          }
        } else if (this.focused == 'key') {
          return key
        }
      },
    },
    {
      keys: ['left', 'ctrl+left', 'shift+tab', 'home'],
      func: key => {
        if (this.focused == 'value' && this.hasKey()) this.focused = 'key'
        else return key
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
   * Shortcuts that only apply when focused on a list
   */
  shortcutsForList: Partial<Command>[] = [
    {
      keys: ['tab', 'ctrl+n'],
      func: () => {
        const length = this.list.$items().length
        if (length == 0 || this.list.selected.index == length - 1) {
          this.createNewLine()
        } else {
          this.list.selectIndex(this.list.selected.index + 1)
        }
      },
    },
    {
      keys: ['left', 'ctrl+left', 'shift+tab', 'home'],
      func: key => {
        if (this.list.$items().length == 0) return key
        if (this.list.selected.index == 0) return key
        this.list.selectIndex(this.list.selected.index - 1)
      },
    },
    {
      keys: ['right', 'ctrl+right', 'end'],
      func: key => {
        if (this.list.$items().length == 0) return key
        if (this.list.selected.index == this.list.$items().length - 1) return key
        this.list.selectIndex(this.list.selected.index + 1)
      },
    },
    {
      keys: 'backspace',
      func: () => {
        if (this.valueRef.childrenValueRefs.length >= 2) {
          this.valueRef.childrenValueRefs = removeFromArray(
            this.valueRef.childrenValueRefs,
            this.list.selected.value
          )
          this.list.selectIndex(this.list.selected.index - 1)
        }
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
  key?: any
  value: any
  type: string
  childrenValueRefs?: ValueRef[]
}

function getValueFromRef(valueRef: ValueRef) {
  if (valueRef.type == 'object') {
    const recursedValueRefs = valueRef.childrenValueRefs.map(ref => [ref.key, getValueFromRef(ref)])
    return Object.fromEntries(recursedValueRefs)
  } else if (valueRef.type == 'array') {
    return valueRef.childrenValueRefs.map(vr => getValueFromRef(vr))
  } else {
    return valueRef.value
  }
}
