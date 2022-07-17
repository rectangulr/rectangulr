import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { Subject } from 'rxjs'
import { Logger } from '../lib/logger'
import { blackOnWhite } from './styles'
import { State } from '../utils/reactivity'
import { filterNulls, longest, mapKeyValue } from '../utils/utils'
import { KeybindService, registerKeybinds } from './keybind-service'

@Component({
  selector: 'keyvalue-editor',
  template: `
    <box [formGroup]="formGroup" [style]="{ flexDirection: 'row' }">
      <box [style]="{ width: keyWidth + 1 }" [classes]="[blackOnWhite]">{{ keyValue.key }}</box>
      <tui-input [formControlName]="keyValue.key" #input [text]="keyValue.value"></tui-input>
    </box>
  `,
  providers: [KeybindService],
})
export class KeyValueEditor {
  constructor(public keybindService: KeybindService, public formGroup: FormGroup) {}

  @Input('object') keyValue: { key: string; value: any }
  @Input() keyWidth = 8

  blackOnWhite = blackOnWhite
}

export function factoryFormGroup(objectEditor: ObjectEditor) {
  return objectEditor.form
}

@Component({
  selector: 'object-editor',
  template: ` <list [items]="keyValues" [displayComponent]="KeyValueEditor"></list> `,
  providers: [
    {
      provide: FormGroup,
      useFactory: factoryFormGroup,
      deps: [ObjectEditor],
    },
  ],
})
export class ObjectEditor {
  @Input() set object(object) {
    this._object.subscribeSource(object)
  }
  @Output() onSubmit = new EventEmitter()

  _object: State<any>
  keyValues: { key: string; value: any }[]
  longestKey = 0
  form: FormGroup
  keybinds = [
    {
      keys: 'enter',
      func: () => {
        this.onSubmit.emit(this.form.value)
      },
    },
  ]

  constructor(
    public logger: Logger,
    public fb: FormBuilder,
    public keybindService: KeybindService
  ) {
    this._object = new State(null, this.destroy$)
    this._object.$.pipe(filterNulls).subscribe(object => {
      const simpleObject = simplifyObject(object)
      this.keyValues = Object.entries(simpleObject).map(([key, value]) => ({
        key: key,
        value: String(value),
      }))
      this.longestKey = longest(this.keyValues)
      this.form = this.fb.group(simpleObject)
    })

    registerKeybinds(this, this.keybinds)
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
    } else {
      return [key, String(value)]
    }
  })
}
