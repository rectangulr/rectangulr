import {
  Component,
  inject,
  Injector,
  input,
  model,
  Signal,
  signal,
  viewChild,
  viewChildren,
  WritableSignal
} from '@angular/core'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import json5 from 'json5'
import * as _ from 'lodash-es'
import { Observable, Subject } from 'rxjs'
import { addStyle, cond } from '../../../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'
import { LOGGER } from '../../../angular-terminal/logger'
import { FocusDirective } from '../../../commands/focus.directive'
import { Command, registerShortcuts, ShortcutService } from '../../../commands/shortcut.service'
import { assert } from '../../../utils/Assert'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { DataFormat } from '../../../utils/data-format'
import { JsonPath } from '../../../utils/jsonPath'
import { subscribe } from '../../../utils/reactivity'
import { patchInputSignal, patchWritableSignal, signal2 } from '../../../utils/Signal2'
import { AnyObject } from '../../../utils/utils'
import { H } from '../../../components/1-basics/h'
import { StyleDirective } from '../../1-basics/style'
import { TextInput } from '../../1-basics/text-input'
import { ExternalTextEditor } from '../external-text-editor'
import { List } from '../list/list'
import { ListItem } from '../list/list-item'
import { LogPointService } from '../../../logs/LogPointService'

@Component({
  selector: 'json-editor',
  template: `
    @if (visibleKey()) {
      <h focusName="key" [focusIf]="focused() == 'key'" [s]="{ flexShrink: 0 }">
        <text-input [(text)]="valueRef().key"/>:
      </h>
    }

    <ng-container focusName="value" [focusIf]="focused() == 'value'">
      @if (['string', 'number', 'boolean', 'null'].includes(valueRef().type)) {
        <text-input
          focusName="text-input"
          [text]="valueText"
          (textChange)="textChange($event)"/>
      }
      @if (valueRef().type == 'object' || valueRef().type == 'array') {
        <list [items]="valueRef().childrenValueRefs?.() ?? []" [focusShortcuts]="shortcutsForList" focusName="list">
          <json-editor
            *item="let ref; type: valueRef().childrenValueRefs?.()"
            focus
            focusName="JsonEditor"
            [focusOnInit]="!!focusPath()"
            [valueRef]="ref"
            [isRoot]="false"
            [focusPath]="$childFocusPath"
            [s]="cond(!isRoot(), { paddingLeft: 2 })"/>
        </list>
        <!-- TODO: conditional style -->
      }
    </ng-container>
    `,
  standalone: true,
  imports: [
    H,
    TextInput,
    List,
    ListItem,
    FocusDirective,
    StyleDirective
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
  readonly data = input(undefined)
  readonly valueRef = model<ValueRef>({ key: null, value: null, type: 'null' })
  readonly dataFormat = input<DataFormat | undefined>(undefined)
  readonly path = input<string[]>([])
  readonly isRoot = input(true)
  readonly focusPath = input<JsonPath | Signal<JsonPath> | Observable<JsonPath> | undefined>(undefined)

  readonly focused = signal<'key' | 'value'>('value')
  valueText: string = ''
  controlValueAccessor = new BaseControlValueAccessor()
  readonly $childFocusPath = signal2<JsonPath>([])

  readonly list = viewChild(List)
  readonly jsonEditors = viewChildren(JsonEditor)

  shortcutService = inject(ShortcutService)
  logger = inject(LOGGER)
  externalTextEditor = inject(ExternalTextEditor)
  injector = inject(Injector)
  lp = inject(LogPointService)

  constructor(
  ) {
    addStyle({ flexDirection: 'row' })
    registerShortcuts(this.shortcuts, { context: { name: 'JsonEditor', ref: this } })
    if (this.isRoot()) {
      registerShortcuts(this.rootShortcuts, { context: { name: 'JsonEditor.root', ref: this } })
    }
  }

  async setup() {
    if (this.isRoot()) {
      let value = undefined
      const dataFormat = this.dataFormat()
      const data = this.data()
      if (dataFormat) {
        value = await dataFormat.completions()
      } else if (data !== undefined) {
        value = data
      } else {
        assert(false)
      }
      this.lp.logPoint('NewValue.Data', { value })
      this.valueRef.set({
        key: null,
        value: value,
        type: typeFromValue(value),
      })
    }
  }

  async ngOnInit() {
    patchInputSignal(this.dataFormat).subscribe(dataFormat => { this.setup() })
    patchInputSignal(this.data).subscribe(data => { this.setup() })

    patchWritableSignal(this.valueRef).subscribe((valueRef) => {
      if (this.visibleKey()) {
        if (this.valueRef().key.length == 0) {
          this.focused.set('key')
        } else {
          this.focused.set('value')
        }
      } else {
        this.focused.set('value')
      }

      if (valueRef.childrenValueRefs === undefined) {
        if (valueRef.type == 'object') {
          valueRef.childrenValueRefs = signal(Object.entries(valueRef.value)
            .map(([key, value]) => ({
              key: key,
              value: value,
              type: typeFromValue(value),
            })))
        } else if (valueRef.type == 'array') {
          valueRef.childrenValueRefs = signal(Object.entries(valueRef.value)
            .map(([key, value]) => ({
              key: Number(key),
              value: value,
              type: typeFromValue(value),
            })))
        } else {
          this.valueText = textFromValue(valueRef.value)
        }
      }
    })

    if (this.isRoot()) {
      this.shortcutService.requestFocus({ reason: 'JsonEditor onInit' })
    }

    // effect(() => {
    //   const focusPath = this.$focusPath()
    //   if (focusPath && focusPath.length == 1) {
    //     if (focusPath[0] == this.valueRef().key) {
    //       this.shortcutService.requestFocus({ soft: false, reason: 'JsonEditor focusPath match' })
    //     }
    //   }
    // })

    // this.$childFocusPath = computed(() => {
    //   const focusPath = this.$focusPath()
    //   if (focusPath) {
    //     if (this.valueRef().type == 'object' || this.valueRef().type == 'array') {
    //       return focusPath
    //     } else {
    //       return focusPath.slice(1)
    //     }
    //   } else {
    //     return null
    //   }
    // })
  }

  textChange(text: string) {
    this.valueText = text
    this.valueRef().value = valueFromText(text)
  }

  /**
   * Creates a javascript object from the json-editor.
   */
  getValue(): AnyObject | string | null | number {
    return getValueFromRef(this.valueRef())
  }

  setValue(value: any) {
    this.valueRef.set({
      key: null,
      value: value,
      type: typeFromValue(value),
    })
  }

  visibleKey() {
    return this.valueRef().key != null && typeof this.valueRef().key == 'string'
  }

  createNewLine() {
    var newValueRef: ValueRef | undefined = undefined
    if (this.valueRef().type == 'object') {
      newValueRef = { key: '', value: '', type: 'string' }
    } else if (this.valueRef().type == 'array') {
      newValueRef = { key: null, value: '', type: 'string' }
    }
    this.valueRef().childrenValueRefs.update(children => {
      return [...children, newValueRef]
    })
    // const index = this.list().items().indexOf(newValueRef)
    // assert(index !== -1, 'item not in list')
    setTimeout(() => this.list().selectIndex(this.valueRef().childrenValueRefs().length - 1))
  }

  focusJsonPath(jsonPath: JsonPath) {
    assert(jsonPath.length > 0)

    if (this.valueRef().type == 'object' || this.valueRef().type == 'array') {
      const key = jsonPath[0]
      const index = this.valueRef().childrenValueRefs().findIndex(ref => ref.key == key)
      if (index == -1) return
      this.list().selectIndex(index)

      if (jsonPath.length >= 2) {
        const rest = jsonPath.slice(1)
        this.jsonEditors().at(index).focusJsonPath(rest)
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
        if (this.focused() == 'value') {
          if (this.visibleKey()) {
            this.focused.set('key')
          } else {
            return key
          }
        } else if (this.focused() == 'key') {
          return key
        }
      },
    },
    {
      keys: ['left', 'ctrl+left', 'shift+tab', 'home'],
      func: key => {
        if (this.focused() == 'value' && this.visibleKey()) this.focused.set('key')
        else return key
      },
    },
    {
      keys: ['right', 'ctrl+right', 'tab', 'end'],
      func: key => {
        if (this.focused() == 'key') this.focused.set('value')
        else if (this.focused() == 'value') return key
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
      func: async () => {
        const length = this.list().items().length
        if (length == 0 || this.list().selectedIndex() == length - 1) {
          await this.createNewLine()
        } else {
          this.list().selectIndex(this.list().selectedIndex() + 1)
        }
      },
    },
    {
      keys: ['left', 'ctrl+left', 'shift+tab', 'home'],
      func: key => {
        if (this.list().items().length == 0) return key
        if (this.list().selectedIndex() == 0) return key
        this.list().selectIndex(this.list().selectedIndex() - 1)
      },
    },
    {
      keys: ['right', 'ctrl+right', 'end'],
      func: key => {
        if (this.list().items().length == 0) return key
        if (this.list().selectedIndex() == this.list().items().length - 1) return key
        this.list().selectIndex(this.list().selectedIndex() + 1)
      },
    },
    {
      keys: 'backspace',
      func: () => {
        if (this.valueRef().childrenValueRefs.length >= 2) {
          this.valueRef().childrenValueRefs.update(children => {
            return children.filter(item => item != this.list().selectedValue())
          })
          this.list().selectIndex(this.list().selectedIndex() - 1)
        }
      },
    },
  ]

  cond = cond

  toString() {
    const keyValue = json5.stringify(this.valueRef())
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
  childrenValueRefs?: WritableSignal<ValueRef[]>
}

function getValueFromRef(valueRef: ValueRef) {
  if (valueRef.type == 'object') {
    const recursedValueRefs = valueRef.childrenValueRefs().map(ref => [ref.key, getValueFromRef(ref)])
    return Object.fromEntries(recursedValueRefs)
  } else if (valueRef.type == 'array') {
    return valueRef.childrenValueRefs().map(vr => getValueFromRef(vr))
  } else {
    return valueRef.value
  }
}
