import * as _ from 'lodash-es'
import { style } from '../../../../../../term-strings/core'

export class StyleColor {
  name: any

  constructor(name) {
    this.name = name

    Reflect.defineProperty(this, `front`, {
      get: _.memoize(() => style.color.front(this.name)),
      enumerable: false,
    })

    Reflect.defineProperty(this, `back`, {
      get: _.memoize(() => style.color.back(this.name)),
      enumerable: false,
    })
  }

  serialize() {
    return this.name
  }

  inspect() {
    return this.serialize()
  }
}
