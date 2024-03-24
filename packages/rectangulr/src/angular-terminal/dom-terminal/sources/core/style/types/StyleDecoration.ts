export class StyleDecoration {
  name: any
  isUnderlined: boolean
  static underline: StyleDecoration = null

  constructor(name, { isUnderlined = false } = {}) {
    this.name = name

    this.isUnderlined = isUnderlined
  }

  serialize() {
    return this.name
  }

  inspect() {
    return this.serialize()
  }
}

StyleDecoration.underline = new StyleDecoration(`underline`, { isUnderlined: true })
