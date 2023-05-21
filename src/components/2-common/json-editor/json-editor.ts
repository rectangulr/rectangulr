import { NgIf } from '@angular/common'
import { Component, Input, QueryList, ViewChild, ViewChildren } from '@angular/core'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import json5 from 'json5'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { Logger } from '../../../angular-terminal/logger'
import { Signal, computed, effect, signal } from '../../../angular-terminal/signals'
import { FocusDebugDirective, FocusDirective } from '../../../commands/focus.directive'
import { Command, ShortcutService, registerShortcuts } from '../../../commands/shortcut.service'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { DataFormat } from '../../../utils/data-format'
import { onChange, subscribe } from '../../../utils/reactivity'
import { Anything, assert, inputToSignal, removeFromArray } from '../../../utils/utils'
import { HBox } from '../../1-basics/box'
import { NewClassesDirective } from '../../1-basics/classes'
import { StyleDirective } from '../../1-basics/style'
import { TextInput } from '../../1-basics/text-input'
import { ExternalTextEditor } from '../external-text-editor'
import { List, selectItem } from '../list/list'
import { ListItem } from '../list/list-item'
import { Observable } from 'rxjs'

/**
 * Used by json-editor to know what part of the json to focus on.
 * Example: {root: {name: 'aa}}
 * JsonPath = ['root','name', 2] would position the caret after 'aa'
 */
export type JsonPath = Array<string | number>

@Component({
  standalone: true,
  selector: 'json-editor',
  host: { '[style]': "{flexDirection: 'row'}" },
  template: `
    <hbox *ngIf="visibleKey()" [focusIf]="focused == 'key'" [style]="{ flexShrink: 0 }">
      <text-input [(text)]="valueRef.key"></text-input>:
    </hbox>

    <ng-container [focusIf]="focused == 'value'">
      <text-input
        *ngIf="['string', 'number', 'boolean', 'null'].includes(valueRef.type)"
        [text]="valueText"
        (textChange)="textChange($event)"></text-input>
      <ng-container *ngIf="valueRef.type == 'object' || valueRef.type == 'array'">
        <list [items]="valueRef.childrenValueRefs" [focusShortcuts]="shortcutsForList">
          <json-editor
            *item="let ref; type: valueRef.childrenValueRefs"
            focus
            [focusOnInit]="!!focusPath"
            [valueRef]="ref"
            [isRoot]="false"
            [focusPath]="$childFocusPath"
            [newclasses]="[[!isRoot, { paddingLeft: 2 }]]"></json-editor>
        </list>
      </ng-container>
    </ng-container>
  `,
  imports: [
    HBox,
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
  @Input() focusPath: JsonPath | Signal<JsonPath> | Observable<JsonPath> | undefined = undefined

  focused: 'key' | 'value' = 'value'
  valueText: string = ''
  controlValueAccessor = new BaseControlValueAccessor()
  $focusPath: Signal<JsonPath | null> = signal(null)
  $childFocusPath: Signal<JsonPath>
  @ViewChild(List) list: List<any>
  @ViewChildren(JsonEditor) jsonEditors: QueryList<JsonEditor>

  constructor(
    public shortcutService: ShortcutService,
    public logger: Logger,
    public externalTextEditor: ExternalTextEditor
  ) {
    onChange(this, 'valueRef', valueRef => {
      this.onValueRefChange()
    })
    inputToSignal(this, 'focusPath', '$focusPath')
  }

  async ngOnInit() {
    // assert(!(this.value && this.valueRef), 'Use [value] or [valueRef]. Not both.')

    let value = undefined
    if (this.isRoot) {
      if (this.data !== undefined) {
        value = this.data
      } else if (this.dataFormat) {
        value = await this.dataFormat.completions()
      } else {
        assert(false)
      }
      this.valueRef = {
        key: null,
        value: value,
        type: typeFromValue(value),
      }
    }

    // effect(() => {
    //   const focusPath = this.$focusPath()
    //   if (focusPath && focusPath.length == 1) {
    //     if (focusPath[0] == this.valueRef.key) {
    //       this.shortcutService.requestFocus({ soft: false, reason: 'JsonEditor focusPath match' })
    //     }
    //   }
    // })

    // this.$childFocusPath = computed(() => {
    //   const focusPath = this.$focusPath()
    //   if (focusPath) {
    //     if (this.valueRef.type == 'object' || this.valueRef.type == 'array') {
    //       return focusPath
    //     } else {
    //       return focusPath.slice(1)
    //     }
    //   } else {
    //     return null
    //   }
    // })

    registerShortcuts(this, this.shortcuts)
    if (this.isRoot) {
      registerShortcuts(this, this.rootShortcuts)
      this.shortcutService.requestFocus({ reason: 'JsonEditor onInit' })
    }
  }

  onValueRefChange() {
    this.focused = this.visibleKey() ? 'key' : 'value'

    if (this.valueRef.type == 'object') {
      this.valueRef.childrenValueRefs = Object.entries(this.valueRef.value).map(([key, value]) => ({
        key: key,
        value: value,
        type: typeFromValue(value),
      }))
    } else if (this.valueRef.type == 'array') {
      this.valueRef.childrenValueRefs = Object.entries(this.valueRef.value).map(([key, value]) => ({
        key: Number(key),
        value: value,
        type: typeFromValue(value),
      }))
    } else {
      this.valueText = textFromValue(this.valueRef.value)
    }
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

  setValue(value: any) {
    this.valueRef = {
      key: null,
      value: value,
      type: typeFromValue(value),
    }
  }

  visibleKey() {
    return this.valueRef.key != null && typeof this.valueRef.key == 'string'
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

  focusJsonPath(jsonPath: JsonPath) {
    assert(jsonPath.length > 0)

    if (this.valueRef.type == 'object' || this.valueRef.type == 'array') {
      const key = jsonPath[0]
      const index = this.valueRef.childrenValueRefs.findIndex(ref => ref.key == key)
      if (index == -1) return
      this.list.selectIndex(index)

      if (jsonPath.length >= 2) {
        const rest = jsonPath.slice(1)
        this.jsonEditors.get(index).focusJsonPath(rest)
      }
    }
  }

  /**
   * Shortcuts
   */
  shortcuts: Partial<Command>[] = [
    {
      keys: 'backspace',
      func: key => {
        if (this.focused == 'value') {
          if (this.visibleKey()) {
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
        if (this.focused == 'value' && this.visibleKey()) this.focused = 'key'
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

  rootShortcuts: Partial<Command>[] = [
    {
      id: 'openInTextEditor',
      func: () => {
        assert(this.externalTextEditor, 'No available externalTextEditor')
        const text = json5.stringify(this.getValue(), null, 2)
        const stream = this.externalTextEditor.edit(text)
        subscribe(this, stream, text => {
          const value = json5.parse(text)
          this.setValue(value)
        })
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
