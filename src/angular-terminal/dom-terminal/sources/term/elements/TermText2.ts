import _ from 'lodash'
import { Anything, assert } from '../../../../../utils/utils'
import { TermElement } from './TermElement'
import cliTruncate from 'cli-truncate'
import wrapAnsi from 'wrap-ansi'
import widestLine from 'widest-line'
import { StyleManager, makeRuleset } from '../../core'

export class TermText2 extends TermElement {
  static elementName = 'text'
  name = 'text'
  textContent: string
  lines = []

  internalDimensions = { width: 0, height: 0 }
  conf: Anything = {
    maxWidth: Number.MAX_SAFE_INTEGER,
    maxHeight: Number.MAX_SAFE_INTEGER,
    wrap: null,
  }

  constructor() {
    super()

    this.styleManager.addRuleset(
      makeRuleset({
        minHeight: 1,
      }),
      StyleManager.RULESET_NATIVE
    )

    this.setPropertyTrigger('textContent', '', {
      trigger: value => {
        this.update()
      },
    })
  }

  setLayoutConfig(configuration: Anything) {
    Object.assign(this.conf, configuration)
    this.update()
  }

  update() {
    if (this.conf.wrap) {
      const wrappedText = wrapText(this.textContent, this.conf.maxWidth, this.conf.wrap)
      this.lines = wrappedText.split('\n')
      this.internalDimensions = measureText(wrappedText)
      this.yogaNode.setFlexShrink(1)
    } else {
      this.lines = this.textContent.split('\n')
      this.internalDimensions = measureText(this.textContent)
      this.yogaNode.setFlexShrink(0)
    }
    this.yogaNode.markDirty()
    this.setDirtyLayoutFlag()
    this.queueDirtyRect()
  }

  getLine(y: number) {
    return this.lines[y]
  }

  getPreferredSize(maxWidth, widthMode, maxHeight, heightMode) {
    if (!isNaN(maxWidth)) {
      maxWidth = Math.ceil(maxWidth)
      this.setLayoutConfig({ maxWidth })
    }

    if (!isNaN(maxHeight)) {
      maxHeight = Math.ceil(maxHeight)
      this.setLayoutConfig({ maxHeight })
    }

    this.update()

    return {
      width: this.internalDimensions.width,
      height: this.internalDimensions.height,
    }
  }

  getInternalContentWidth() {
    return this.internalDimensions.width
  }

  getInternalContentHeight() {
    return this.internalDimensions.height
  }

  renderContent(x, y, l) {
    if (this.getInternalContentHeight() <= y) return this.renderBackground(l)

    let fullLine = y < this.getInternalContentHeight() ? this.getLine(y) : ``
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

function measureText(text: string) {
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
