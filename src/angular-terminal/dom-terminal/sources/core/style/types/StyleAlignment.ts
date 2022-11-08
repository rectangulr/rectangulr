export class StyleAlignment {
  name: any
  isLeftAligned: boolean
  isCentered: boolean
  isRightAligned: boolean
  isJustified: boolean
  static left: StyleAlignment = null
  static center: StyleAlignment = null
  static right: StyleAlignment = null
  static justify: StyleAlignment = null

  constructor(
    name,
    { isLeftAligned = false, isCentered = false, isRightAligned = false, isJustified = false } = {}
  ) {
    this.name = name

    this.isLeftAligned = isLeftAligned
    this.isCentered = isCentered
    this.isRightAligned = isRightAligned
    this.isJustified = isJustified
  }

  serialize() {
    return this.name
  }

  inspect() {
    return this.serialize()
  }
}

StyleAlignment.left = new StyleAlignment(`left`, { isLeftAligned: true })
StyleAlignment.center = new StyleAlignment(`center`, { isCentered: true })
StyleAlignment.right = new StyleAlignment(`right`, { isRightAligned: true })
StyleAlignment.justify = new StyleAlignment(`justify`, { isJustified: true })
