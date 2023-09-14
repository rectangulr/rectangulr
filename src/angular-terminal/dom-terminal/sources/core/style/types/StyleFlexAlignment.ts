import Yoga from 'typeflex'

export class StyleFlexAlignment {
  static auto: StyleFlexAlignment = null
  static flexStart: StyleFlexAlignment = null
  static flexEnd: StyleFlexAlignment = null
  static center: StyleFlexAlignment = null
  static spaceBetween: StyleFlexAlignment = null
  static spaceAround: StyleFlexAlignment = null
  static stretch: StyleFlexAlignment = null
  toYoga: () => any

  serialize() {
    return null
  }

  inspect() {
    return this.serialize()
  }
}

StyleFlexAlignment.auto = new StyleFlexAlignment()
StyleFlexAlignment.auto.serialize = () => `auto`
StyleFlexAlignment.auto.toYoga = () => Yoga.ALIGN_AUTO

StyleFlexAlignment.flexStart = new StyleFlexAlignment()
StyleFlexAlignment.flexStart.serialize = () => `flexStart`
StyleFlexAlignment.flexStart.toYoga = () => Yoga.ALIGN_FLEX_START

StyleFlexAlignment.flexEnd = new StyleFlexAlignment()
StyleFlexAlignment.flexEnd.serialize = () => `flexEnd`
StyleFlexAlignment.flexEnd.toYoga = () => Yoga.ALIGN_FLEX_END

StyleFlexAlignment.center = new StyleFlexAlignment()
StyleFlexAlignment.center.serialize = () => `center`
StyleFlexAlignment.center.toYoga = () => Yoga.ALIGN_CENTER

StyleFlexAlignment.spaceBetween = new StyleFlexAlignment()
StyleFlexAlignment.spaceBetween.serialize = () => `spaceBetween`
StyleFlexAlignment.spaceBetween.toYoga = () => Yoga.ALIGN_SPACE_BETWEEN

StyleFlexAlignment.spaceAround = new StyleFlexAlignment()
StyleFlexAlignment.spaceAround.serialize = () => `spaceAround`
StyleFlexAlignment.spaceAround.toYoga = () => Yoga.ALIGN_SPACE_AROUND

StyleFlexAlignment.stretch = new StyleFlexAlignment()
StyleFlexAlignment.stretch.serialize = () => `stretch`
StyleFlexAlignment.stretch.toYoga = () => Yoga.ALIGN_STRETCH
