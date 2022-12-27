import _ from 'lodash'
import { assert } from '../../../../../utils/utils'
import { TermElement } from './TermElement'

export class TermText2 extends TermElement {
  textContent: string
  textLayout: TextLayout2

  constructor() {
    super()

    this.textLayout = new TextLayout2()

    this.setPropertyTrigger('textContent', '', {
      trigger: value => {
        this.textLayout.text = value
        this.textLayout.update()
        this.yogaNode.markDirty()
        this.setDirtyLayoutFlag()
        this.queueDirtyRect()
      },
    })
  }

  getPreferredSize(maxWidth, widthMode, maxHeight, heightMode) {
    if (this.textLayout.maxWidth == Infinity) {
      this.textLayout.maxWidth = maxWidth
    }
    this.textLayout.update()
    this.yogaNode.markDirty()
    this.setDirtyLayoutFlag()
    this.queueDirtyRect()

    let width = this.textLayout.getWidth()
    let height = this.textLayout.getHeight()

    return { width, height }
  }

  getInternalContentWidth() {
    return this.textLayout.getWidth()
  }

  getInternalContentHeight() {
    return this.textLayout.getHeight()
  }

  renderContent(x, y, l) {
    if (this.textLayout.getHeight() <= y) return this.renderBackground(l)

    let fullLine = y < this.textLayout.getHeight() ? this.textLayout.getLine(y) : ``
    let fullLineLength = fullLine.length

    let fullLineStart = 0

    if (this.style.$.textAlign.isCentered)
      fullLineStart = Math.floor((this.scrollRect.width - fullLineLength) / 2)

    if (this.style.$.textAlign.isRightAligned)
      fullLineStart = this.scrollRect.width - fullLineLength

    let prefixLength = Math.max(0, Math.min(fullLineStart - x, l))
    let lineStart = Math.max(0, x - fullLineStart)
    let lineLength = Math.max(0, Math.min(l + x - fullLineStart, l, fullLineLength - lineStart))
    let suffixLength = Math.max(0, l - prefixLength - lineLength)

    let prefix = this.renderBackground(prefixLength)
    let text = this.renderText(fullLine.substr(lineStart, lineLength))
    let suffix = this.renderBackground(suffixLength)

    return prefix + text + suffix
  }
}

/**
 * Defines how text is laid-out inside a rectangle.
 * If the rectangle is too small it should go to the next line.
 * If the rectanglr is big enough, fine. Just inform the parent of its size.
 */
export class TextLayout2 {
  text = ''
  maxWidth = Infinity
  lines = []

  update() {
    this.lines = []

    const nbOfLines = Number(this.text.length / this.maxWidth)
    assert(nbOfLines < 10_000)

    for (let i = 0; i < nbOfLines; i++) {
      const nextLine = this.text.slice(this.maxWidth * i, this.maxWidth * (i + 1))
      this.lines.push(nextLine)
    }
    if (this.lines.length == 0) {
      this.lines = ['']
    }
  }

  getLine(y: number) {
    return this.lines[y]
  }

  getHeight() {
    return this.lines.length
  }

  getWidth() {
    if (this.lines.length > 1) {
      return this.maxWidth
    } else if (this.lines.length == 1) {
      return this.lines[0].length
    } else {
      return 0
    }
  }
}
