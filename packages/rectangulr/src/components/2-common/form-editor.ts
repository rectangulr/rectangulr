import { Component, computed, inject, input, Output, viewChild } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import * as json5 from 'json5'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { Logger } from '../../angular-terminal/logger'
import { FocusDirective } from '../../commands/focus.directive'
import { registerShortcuts, ShortcutService } from '../../commands/shortcut.service'
import { longest, mapKeyValue } from '../../utils/utils'
import { KeyValueEditor } from './KeyValueEditor'
import { List } from './list/list'
import { ListItem } from './list/list-item'
import { blackOnWhite } from './styles'

@Component({
  standalone: true,
  imports: [List, KeyValueEditor, ListItem, FocusDirective],
  selector: 'form-editor',
  template: `
    <list [items]="keyValues()">
      <keyvalue-editor
        *item="let keyValue; type: keyValues"
        focus
        [keyValue]="keyValue"
        [keyWidth]="longestKey()"/>
    </list>
  `,
  providers: [
    {
      provide: FormGroup,
      useFactory: () => inject(FormEditor).form(),
    },
  ],
})
export class FormEditor {
  object = input.required()
  @Output() onSubmit = new Subject()

  simpleObject = computed(() => simplifyObject(this.object()))
  keyValues = computed(() => Object.entries(this.simpleObject())
    .map(([key, value]) => ({
      key: key,
      value: value,
    }))
  )
  longestKey = computed(() => longest(this.keyValues()))
  form = computed(() => this.fb.group(this.simpleObject()))

  readonly list = viewChild(List)

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
    registerShortcuts(this.keybinds)
  }

  getValue() {
    const value = mapBackToOriginalTypes({
      formObject: this.form().value,
      originalObject: this.object()
    })
    return value
  }

  blackOnWhite = blackOnWhite
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
