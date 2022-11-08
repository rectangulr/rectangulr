import _ from 'lodash'
import { TermText2 } from './TermText2'

export class TermInput2 extends TermText2 {
  autoWidth: any
  autoHeight: any

  constructor() {
    super()

    this.setPropertyAccessor(`value`, {
      validate: value => {
        return _.isString(value)
      },

      get: () => {
        return this.textContent
      },

      set: value => {
        this.textContent = value
      },
    })
  }

  getPreferredSize(maxWidth) {
    let { width, height } = super.getPreferredSize(maxWidth)

    if (!this.autoWidth) width = 0

    if (!this.autoHeight) height = 0

    return { width, height }
  }
}
