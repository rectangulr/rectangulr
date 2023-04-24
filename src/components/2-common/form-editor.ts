import { Component, Input, Output, ViewChild } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import * as json5 from 'json5'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { Logger } from '../../angular-terminal/logger'
import { registerShortcuts, ShortcutService } from '../../commands/shortcut.service'
import { State } from '../../utils/reactivity'
import { longest, mapKeyValue } from '../../utils/utils'
import { HBox } from '../1-basics/box'
import { ClassesDirective } from '../1-basics/classes'
import { TextInput } from '../1-basics/text-input'
import { List } from './list/list'
import { ListItem } from './list/list-item'
import { blackOnWhite } from './styles'
import { FocusDirective } from '../../public-api'

@Component({
  standalone: true,
  imports: [HBox, TextInput, ReactiveFormsModule, ClassesDirective],
  selector: 'keyvalue-editor',
  template: `
    <vbox [formGroup]="formGroup" [style]="{ flexDirection: 'row' }">
      <vbox [style]="{ width: keyWidth + 1 }" [classes]="[blackOnWhite]">{{ keyValue.key }}</vbox>
      <text-input [formControlName]="keyValue.key" [text]="keyValue.value"></text-input>
    </vbox>
  `,
})
export class KeyValueEditor {
  @Input() keyValue: { key: string; value: any } = null
  @Input() keyWidth = 0

  constructor(public shortcutService: ShortcutService, public formGroup: FormGroup) {}

  ngOnInit() {
    if (!this.keyWidth) {
      this.keyWidth = this.keyValue.key.length
    }
  }

  blackOnWhite = blackOnWhite

  ngOnDestroy() {
    this.shortcutService.unfocus()
  }
}

@Component({
  standalone: true,
  imports: [List, KeyValueEditor, ListItem, FocusDirective],
  selector: 'form-editor',
  template: `
    <list [items]="keyValues">
      <keyvalue-editor
        *item="let keyValue; type: keyValues"
        focus
        [keyValue]="keyValue"
        [keyWidth]="longestKey"></keyvalue-editor>
    </list>
  `,
  providers: [
    {
      provide: FormGroup,
      useFactory: (objectEditor: FormEditor) => objectEditor.form,
      deps: [FormEditor],
    },
  ],
})
export class FormEditor {
  @Input() set object(object) {
    this._object.subscribeSource(object)
  }
  @Output() onSubmit = new Subject()

  @ViewChild(List) list: List<any>

  _object: State<any>
  keyValues: { key: string; value: any }[]
  longestKey = 0
  form: FormGroup
  keybinds = [
    {
      keys: 'enter',
      func: () => {
        const value = this.getValue()
        this.onSubmit.next(value)
      },
    },
  ]

  constructor(
    public logger: Logger,
    public fb: FormBuilder,
    public shortcutService: ShortcutService
  ) {
    this._object = new State(null, this.destroy$)
    this._object.$.subscribe(object => {
      if (!object) {
        object = {}
      }
      const simpleObject = simplifyObject(object)
      this.keyValues = Object.entries(simpleObject).map(([key, value]) => ({
        key: key,
        value: value,
      }))
      this.longestKey = longest(this.keyValues)
      this.form = this.fb.group(simpleObject)
    })

    registerShortcuts(this, this.keybinds)
  }

  getValue() {
    const value = mapBackToOriginalTypes({
      formObject: this.form.value,
      originalObject: this._object.value,
    })
    return value
  }

  blackOnWhite = blackOnWhite

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}

// Removes arrays. Transforms values into strings.
function simplifyObject(object) {
  return mapKeyValue(object, (key, value) => {
    if (Array.isArray(value)) {
      return undefined
    } else if (value === null) {
      return [key, '']
    } else {
      return [key, String(value)]
    }
  })
}

function mapBackToOriginalTypes(args: { formObject: any; originalObject: any }) {
  const { formObject, originalObject } = args
  return _.mapValues(formObject, (value, key) => {
    if (_.has(originalObject, key)) {
      const originalValue = originalObject[key]
      const originalType = typeof originalValue
      if (originalValue === null && ['', 'null'].includes(value)) {
        return null
      } else if (originalType === 'boolean') {
        return !['null', 'no', 'false', '0'].includes(value as string)
      } else if (originalType === 'string') {
        return value
      } else if (originalType === 'number') {
        return Number(value as string)
      } else if (originalType === 'bigint') {
        return BigInt(value as string)
      } else if (originalType === 'object') {
        return json5.parse(value as string)
      }
    } else {
      return value
    }
  })
}
