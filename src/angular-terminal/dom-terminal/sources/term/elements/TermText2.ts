import _ from 'lodash'
import { Anything, assert } from '../../../../../utils/utils'
import { TermElement } from './TermElement'
import cliTruncate from 'cli-truncate'
import wrapAnsi from 'wrap-ansi'
import widestLine from 'widest-line'
import { StyleManager, makeRuleset } from '../../core'

export class TermText2 extends TermElement {
  textContent: string
  textLayout: TextLayout2

  constructor() {
    super()

    this.styleManager.addRuleset(
      makeRuleset({
        minHeight: 1,
      }),
      StyleManager.RULESET_NATIVE
    )

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
    if (!isNaN(maxWidth)) {
      maxWidth = Math.ceil(maxWidth)
      this.textLayout.setConfiguration({ maxWidth })
    }

    if (!isNaN(maxHeight)) {
      maxHeight = Math.ceil(maxHeight)
      this.textLayout.setConfiguration({ maxHeight })
    }

    this.textLayout.update()
    this.yogaNode.markDirty()
    this.setDirtyLayoutFlag()
    this.queueDirtyRect()

    return {
      width: this.textLayout.getWidth(),
      height: this.textLayout.getHeight(),
    }
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
 * If the rectangle is big enough, fine. Just inform the parent of its size.
 */
export class TextLayout2 {
  text = ''
  lines = []

  /**
   *
   */
  dimensions = { width: 0, height: 0 }
  textDimensions = { width: 0, height: 0 }
  conf: Anything = {
    maxWidth: Number.MAX_SAFE_INTEGER,
    maxHeight: Number.MAX_SAFE_INTEGER,
    wrap: 'truncate-end',
  }

  setConfiguration(keyValues: Anything) {
    Object.assign(this.conf, keyValues)
    this.update()
  }

  update() {
    const wrappedText = wrapText(this.text, this.conf.maxWidth, this.conf.wrap)
    this.lines = wrappedText.split('\n')
    this.textDimensions = measureText(wrappedText)

    this.dimensions.width = _.clamp(this.textDimensions.width, 0, this.conf.maxWidth)
    this.dimensions.height = _.clamp(this.textDimensions.height, 0, this.conf.maxHeight)

    assert(this.dimensions.width <= this.conf.maxWidth)
    assert(this.dimensions.height <= this.conf.maxHeight)
  }

  getLine(y: number) {
    return this.lines[y]
  }

  getHeight() {
    return this.dimensions.height
  }

  getWidth() {
    return this.dimensions.width
  }
}

export function wrapText(text: string, maxWidth: number, wrapType: string): string {
  let wrappedText = text

  if (wrapType === 'wrap') {
    wrappedText = wrapAnsi(text, maxWidth, {
      trim: false,
      hard: true,
    })
  }

  if (wrapType!.startsWith('truncate')) {
    let position: 'end' | 'middle' | 'start' = 'end'

    if (wrapType === 'truncate-middle') {
      position = 'middle'
    }

    if (wrapType === 'truncate-start') {
      position = 'start'
    }

    wrappedText = cliTruncate(text, maxWidth, { position })
  }

  return wrappedText
}

export interface TextSize {
  width: number
  height: number
}

function measureText(text: string): TextSize {
  if (text.length === 0) {
    return {
      width: 0,
      height: 0,
    }
  }

  const width = widestLine(text)
  const height = text.split('\n').length
  const size = { width, height }

  return size
}
