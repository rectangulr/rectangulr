export class StyleInherit {
  static inherit: any = null

  constructor() {}

  serialize() {
    return null
  }

  inspect() {
    return this.serialize()
  }
}

StyleInherit.inherit = new StyleInherit()
StyleInherit.inherit.serialize = () => `inherit`
