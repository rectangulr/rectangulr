import { Component, Input, Output } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import _ from 'lodash'
import * as json5 from 'json5'
import { Subject } from 'rxjs'
import { Logger } from '../../angular-terminal/logger'
import { State } from '../../utils/reactivity'
import { longest, mapKeyValue } from '../../utils/utils'
import { blackOnWhite } from './styles'
import { ShortcutService, registerShortcuts } from '../../commands/shortcut.service'

@Component({
  selector: 'keyvalue-editor',
  template: `
    <box [formGroup]="formGroup" [style]="{ flexDirection: 'row' }">
      <box [style]="{ width: keyWidth + 1 }" [classes]="[blackOnWhite]">{{ keyValue.key }}</box>
      <text-input [formControlName]="keyValue.key" #input [text]="keyValue.value"></text-input>
    </box>
  `,
  providers: [ShortcutService],
})
export class KeyValueEditor {
  @Input() keyValue: { key: string; value: any } = null
  @Input() keyWidth = 8

  constructor(public shortcutService: ShortcutService, public formGroup: FormGroup) {}

  ngOnInit() {
    this.keyWidth = this.keyValue.key.length + 1
  }

  blackOnWhite = blackOnWhite

  ngOnDestroy() {
    this.shortcutService.unfocus()
  }
}

@Component({
  selector: 'form-editor',
  template: `
    <list [items]="keyValues">
      <keyvalue-editor
        *item="let keyValue; type: keyValues"
        focus
        [keyValue]="keyValue"></keyvalue-editor>
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

  _object: State<any>
  keyValues: { key: string; value: any }[]
  longestKey = 0
  form: FormGroup
  keybinds = [
    {
      keys: 'enter',
      func: () => {
        const value = mapBackToOriginalTypes({
          formObject: this.form.value,
          originalObject: this._object.value,
        })
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
