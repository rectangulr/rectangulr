export class StyleBackgroundClip {
  doesIncludeBorders: boolean
  doesIncludePadding: boolean
  static borderBox: StyleBackgroundClip = null
  static paddingBox: StyleBackgroundClip = null
  static contentBox: StyleBackgroundClip = null

  constructor({ doesIncludeBorders = false, doesIncludePadding = false } = {}) {
    this.doesIncludeBorders = doesIncludeBorders
    this.doesIncludePadding = doesIncludePadding
  }

  serialize() {
    return null
  }

  inspect() {
    return this.serialize()
  }
}

StyleBackgroundClip.borderBox = new StyleBackgroundClip({
  doesIncludeBorders: true,
  doesIncludePadding: true,
})
StyleBackgroundClip.borderBox.serialize = () => `borderBox`

StyleBackgroundClip.paddingBox = new StyleBackgroundClip({ doesIncludePadding: true })
StyleBackgroundClip.paddingBox.serialize = () => `paddingBox`

StyleBackgroundClip.contentBox = new StyleBackgroundClip()
StyleBackgroundClip.contentBox.serialize = () => `contentBox`
