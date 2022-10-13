import Yoga from 'yoga-layout'

export class StyleDisplay {
  static flex: StyleDisplay = null
  static none: StyleDisplay = null
  toYoga: () => any

  serialize() {
    return null
  }

  inspect() {
    return this.serialize()
  }
}

StyleDisplay.flex = new StyleDisplay()
StyleDisplay.flex.serialize = () => `flex`
StyleDisplay.flex.toYoga = () => Yoga.DISPLAY_FLEX

StyleDisplay.none = new StyleDisplay()
StyleDisplay.none.serialize = () => `none`
StyleDisplay.none.toYoga = () => Yoga.DISPLAY_NONE
