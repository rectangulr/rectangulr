import { Yoga } from "../../layout/typeflex"

export class StyleFlexJustify {
  static flexStart: StyleFlexJustify = null
  static flexEnd: StyleFlexJustify = null
  static center: StyleFlexJustify = null
  static spaceBetween: StyleFlexJustify = null
  static spaceAround: StyleFlexJustify = null
  static spaceEvenly: StyleFlexJustify = null

  toYoga: () => any

  serialize() {
    return null
  }

  inspect() {
    return this.serialize()
  }
}

StyleFlexJustify.flexStart = new StyleFlexJustify()
StyleFlexJustify.flexStart.serialize = () => 'flexStart'
StyleFlexJustify.flexStart.toYoga = () => Yoga.JUSTIFY_FLEX_START

StyleFlexJustify.flexEnd = new StyleFlexJustify()
StyleFlexJustify.flexEnd.serialize = () => 'flexEnd'
StyleFlexJustify.flexEnd.toYoga = () => Yoga.JUSTIFY_FLEX_END

StyleFlexJustify.center = new StyleFlexJustify()
StyleFlexJustify.center.serialize = () => 'center'
StyleFlexJustify.center.toYoga = () => Yoga.JUSTIFY_CENTER

StyleFlexJustify.spaceBetween = new StyleFlexJustify()
StyleFlexJustify.spaceBetween.serialize = () => 'spaceBetween'
StyleFlexJustify.spaceBetween.toYoga = () => Yoga.JUSTIFY_SPACE_BETWEEN

StyleFlexJustify.spaceAround = new StyleFlexJustify()
StyleFlexJustify.spaceAround.serialize = () => 'spaceAround'
StyleFlexJustify.spaceAround.toYoga = () => Yoga.JUSTIFY_SPACE_AROUND

StyleFlexJustify.spaceEvenly = new StyleFlexJustify()
StyleFlexJustify.spaceEvenly.serialize = () => 'spaceEvenly'
StyleFlexJustify.spaceEvenly.toYoga = () => Yoga.JUSTIFY_SPACE_EVENLY
