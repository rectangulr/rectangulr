import {
  Component,
  Injector,
  Input,
  model,
  Signal,
  signal,
  viewChild,
  viewChildren,
  WritableSignal
} from '@angular/core'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import json5 from 'json5'
import _ from 'lodash'
import { Observable, Subject } from 'rxjs'
import { addStyle, cond } from '../../../angular-terminal/dom-terminal/sources/core/dom/StyleHandler'
import { Logger } from '../../../angular-terminal/logger'
import { FocusDirective } from '../../../commands/focus.directive'
import { Command, registerShortcuts, ShortcutService } from '../../../commands/shortcut.service'
import { BaseControlValueAccessor } from '../../../utils/base-control-value-accessor'
import { DataFormat } from '../../../utils/data-format'
import { JsonPath } from '../../../utils/jsonPath'
import { onChange, propToSignal, subscribe } from '../../../utils/reactivity'
import { patchWritableSignal } from '../../../utils/Signal2'
import { AnyObject, assert, inputToSignal } from '../../../utils/utils'
import { HBox } from '../../1-basics/box'
import { StyleDirective } from '../../1-basics/style'
import { TextInput } from '../../1-basics/text-input'
import { ExternalTextEditor } from '../external-text-editor'
import { List } from '../list/list'
import { ListItem } from '../list/list-item'

@Component({
  selector: 'json-editor',
  template: `
    @if (visibleKey()) {
      <h [focusIf]="focused() == 'key'" [s]="{ flexShrink: 0 }">
        <text-input [(text)]="valueRef().key"/>:
      </h>
    }

    <ng-container [focusIf]="focused() == 'value'">
      @if (['string', 'number', 'boolean', 'null'].includes(valueRef().type)) {
        <text-input
          [text]="valueText"
          (textChange)="textChange($event)"/>
      }
      @if (valueRef().type == 'object' || valueRef().type == 'array') {
        <list [items]="valueRef().childrenValueRefs?.() ?? []" [focusShortcuts]="shortcutsForList">
          <json-editor
            *item="let ref; type: valueRef().childrenValueRefs?.()"
            focus
            [focusOnInit]="!!focusPath"
            [valueRef]="ref"
            [isRoot]="false"
            [focusPath]="$childFocusPath"
            [s]="cond(!isRoot, { paddingLeft: 2 })"/>
        </list>
        <!-- TODO: conditional style -->
      }
    </ng-container>
    `,
  standalone: true,
  imports: [
    HBox,
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
  @Input() data = undefined
  valueRef = model<ValueRef>({ key: null, value: null, type: 'null' })
  @Input() dataFormat: DataFormat | undefined = null
  @Input() path: string[] = []
  @Input() isRoot = true
  @Input() focusPath: JsonPath | Signal<JsonPath> | Observable<JsonPath> | undefined = undefined

  focused = signal<'key' | 'value'>('value')
  valueText: string = ''
  controlValueAccessor = new BaseControlValueAccessor()
  $focusPath: Signal<JsonPath | null> = signal(null)
  $childFocusPath: Signal<JsonPath>

  list = viewChild(List)
  jsonEditors = viewChildren(JsonEditor)

  constructor(
    public shortcutService: ShortcutService,
    public logger: Logger,
    public externalTextEditor: ExternalTextEditor,
    public injector: Injector
  ) {
    addStyle({ flexDirection: 'row' })
    onChange(this, 'dataFormat', dataFormat => { this.setup() })
    onChange(this, 'data', data => { this.setup() })
    inputToSignal(this, 'focusPath', '$focusPath')
    propToSignal(this, 'isRoot')
    registerShortcuts(this.shortcuts)
    if (this.isRoot) {
      registerShortcuts(this.rootShortcuts)
      this.shortcutService.requestFocus({ reason: 'JsonEditor onInit' })
    }
  }

  async setup() {
    if (this.isRoot) {
      let value = undefined
      if (this.dataFormat) {
        value = await this.dataFormat.completions()
      } else if (this.data !== undefined) {
        value = this.data
      } else {
        assert(false)
      }
      this.valueRef.set({
        key: null,
        value: value,
        type: typeFromValue(value),
      })
    }
  }

  async ngOnInit() {
    // assert(!(this.value && this.valueRef), 'Use [value] or [valueRef]. Not both.')

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

    this.setup()

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
    var newValueRef
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
      context: this,
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
