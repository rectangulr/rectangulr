import _ from 'lodash'
import TextBuffer from 'text-buffer'

import { TermTextBase } from './TermTextBase'

export class TermText extends TermTextBase {
  textBuffer: any
  textContent: string

  constructor({ textContent = ``, textBuffer = new TextBuffer(textContent), ...props } = {}) {
    super({ ...props, textBuffer, enterIsNewline: true, disabled: true })

    this.setPropertyAccessor(`contentText`, {
      validate: value => {
        return true
      },

      get: () => {
        throw new Error(`Failed to read 'contentText': Use 'textContent' instead.`)
      },

      set: () => {
        throw new Error(`Failed to write 'contentText': Use 'textContent' instead.`)
      },
    })

    this.setPropertyAccessor(`textContent`, {
      validate: value => {
        return _.isString(value)
      },

      get: () => {
        return this.textBuffer.getText()
      },

      set: value => {
        if (value === this.textBuffer.getText()) return

        this.textBuffer.setText(value)
      },
    })
  }
}
