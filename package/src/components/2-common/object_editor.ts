import { Component, Input, Output } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import * as  _ from 'lodash'
import * as json5 from 'json5'
import { Subject } from 'rxjs'
import { Logger } from '../../angular-terminal/logger'
import { State } from '../../lib/reactivity'
import { longest, mapKeyValue } from '../../lib/utils'
import { blackOnWhite } from './styles'
import { CommandService, registerCommands } from '../../commands/command-service'

@Component({
  selector: 'keyvalue-editor',
  template: `
    <box [formGroup]="formGroup" [style]="{ flexDirection: 'row' }">
      <box [style]="{ width: keyWidth + 1 }" [classes]="[blackOnWhite]">{{ keyValue.key }}</box>
      <tui-input [formControlName]="keyValue.key" #input [text]="keyValue.value"></tui-input>
    </box>
  `,
  providers: [CommandService],
})
export class KeyValueEditor {
  @Input('object') keyValue: { key: string; value: any }
  @Input() keyWidth = 8

  constructor(public commandService: CommandService, public formGroup: FormGroup) {}

  blackOnWhite = blackOnWhite

  ngOnDestroy() {
    this.commandService.unfocus()
  }
}

@Component({
  selector: 'object-editor',
  template: ` <list [items]="keyValues" [displayComponent]="KeyValueEditor"></list> `,
  providers: [
    {
      provide: FormGroup,
      useFactory: (objectEditor: ObjectEditor) => objectEditor.form,
      deps: [ObjectEditor],
    },
  ],
})
export class ObjectEditor {
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
    public commandService: CommandService
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

    registerCommands(this, this.keybinds)
  }

  blackOnWhite = blackOnWhite
  KeyValueEditor = KeyValueEditor

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next()
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