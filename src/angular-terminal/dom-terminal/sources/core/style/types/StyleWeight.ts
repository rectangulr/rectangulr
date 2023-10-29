export class StyleWeight {
  static normal: StyleWeight = null
  static bold: StyleWeight = null

  constructor(public size: any) { }

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
