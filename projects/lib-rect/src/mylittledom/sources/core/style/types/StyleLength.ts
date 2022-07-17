export class StyleLength {
  size: number
  isRelative: boolean
  static autoNaN: StyleLength = null
  static auto: StyleLength = null
  static infinity: StyleLength = null

  constructor(size = 0, isRelative = false) {
    this.size = size
    this.isRelative = isRelative
  }

  resolve(relativeTo) {
    if (this.isRelative) {
      return (this.size * relativeTo) / 100
    } else {
      return this.size
    }
  }

  serialize() {
    if (this.isRelative) {
      return `${this.size}%`
    } else {
      return this.size
    }
  }

  toYoga() {
    return this.serialize()
  }

  valueOf() {
    return this.size
  }

  inspect() {
    return this.serialize()
  }
}

StyleLength.autoNaN = new StyleLength()
StyleLength.autoNaN.toYoga = () => NaN
StyleLength.autoNaN.serialize = () => `auto`

StyleLength.auto = new StyleLength()
StyleLength.auto.serialize = () => `auto`

// Not actually infinity! Otherwise we have issues when substracting sizes (Infinity - Infinity = NaN)
StyleLength.infinity = new StyleLength(Number.MAX_SAFE_INTEGER)
