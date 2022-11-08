export class StyleWeight {
  size: any
  static normal: StyleWeight = null
  static bold: StyleWeight = null

  constructor(size) {
    this.size = size
  }

  serialize() {
    return this.size
  }

  valueOf() {
    return this.size
  }

  inspect() {
    return this.serialize()
  }
}

StyleWeight.normal = new StyleWeight(400)
StyleWeight.normal.serialize = () => `normal`

StyleWeight.bold = new StyleWeight(700)
StyleWeight.bold.serialize = () => `bold`
