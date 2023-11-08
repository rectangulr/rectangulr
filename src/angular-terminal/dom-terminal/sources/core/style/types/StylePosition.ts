import * as Yoga from 'typeflex'

export class StylePosition {
  isPositioned: boolean
  isAbsolutelyPositioned: boolean
  isScrollAware: boolean
  static relative: StylePosition = null
  static sticky: StylePosition = null
  static absolute: StylePosition = null
  static fixed: StylePosition = null

  toYoga: () => any

  constructor({
    isPositioned = false,
    isAbsolutelyPositioned = false,
    isScrollAware = false,
  } = {}) {
    this.isPositioned = isPositioned
    this.isAbsolutelyPositioned = isAbsolutelyPositioned
    this.isScrollAware = isScrollAware
  }

  serialize() {
    return null
  }

  inspect() {
    return this.serialize()
  }
}

StylePosition.relative = new StylePosition({ isPositioned: true, isScrollAware: true })
StylePosition.relative.serialize = () => `relative`
StylePosition.relative.toYoga = () => Yoga.POSITION_TYPE_RELATIVE

StylePosition.sticky = new StylePosition({ isPositioned: true, isScrollAware: true })
StylePosition.sticky.serialize = () => `sticky`
StylePosition.sticky.toYoga = () => Yoga.POSITION_TYPE_RELATIVE

StylePosition.absolute = new StylePosition({
  isPositioned: true,
  isAbsolutelyPositioned: true,
  isScrollAware: true,
})
StylePosition.absolute.serialize = () => `absolute`
StylePosition.absolute.toYoga = () => Yoga.POSITION_TYPE_ABSOLUTE

StylePosition.fixed = new StylePosition({ isPositioned: true, isAbsolutelyPositioned: true })
StylePosition.fixed.serialize = () => `fixed`
StylePosition.fixed.toYoga = () => Yoga.POSITION_TYPE_ABSOLUTE
