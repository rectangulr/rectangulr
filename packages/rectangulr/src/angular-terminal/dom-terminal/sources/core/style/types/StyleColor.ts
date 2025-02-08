import * as _ from 'lodash-es'
import { style } from '../../../../../../term-strings/core'

export class StyleColor {

  constructor(public value) { }

  front = style.color.front(this.value)
  back = style.color.back(this.value)

  serialize() {
    return this.value
  }

  inspect() {
    return this.serialize()
  }
}
