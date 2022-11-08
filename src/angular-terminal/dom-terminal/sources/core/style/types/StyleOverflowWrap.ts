export class StyleOverflowWrap {
  doesBreakWords: boolean
  static normal: StyleOverflowWrap = null
  static breakWord: StyleOverflowWrap = null

  constructor({ doesBreakWords = false } = {}) {
    this.doesBreakWords = doesBreakWords
  }

  serialize() {
    return null
  }

  inspect() {
    return this.serialize()
  }
}

StyleOverflowWrap.normal = new StyleOverflowWrap()
StyleOverflowWrap.normal.serialize = () => `normal`

StyleOverflowWrap.breakWord = new StyleOverflowWrap({ doesBreakWords: true })
StyleOverflowWrap.breakWord.serialize = () => `breakWord`
