import { style } from '@manaflair/term-strings'
import _ from 'lodash'

export class StyleColor {
  name: any

  constructor(name) {
    this.name = name

    Reflect.defineProperty(this, `front`, {
      get: _.memoize(() => style.color.front(this.name).in),
      enumerable: false,
    })

    Reflect.defineProperty(this, `back`, {
      get: _.memoize(() => style.color.back(this.name).in),
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
