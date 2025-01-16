// @ts-nocheck
import cliTruncate from 'cli-truncate'
import _ from 'lodash-es'
import widestLine from 'widest-line'
import wrapAnsi from 'wrap-ansi'
import { assert } from '../../../../../utils/utils'
import { Element } from './Element'

export class TermText2 extends Element {
  textContent: string
  maxWidth = Number.MAX_SAFE_INTEGER
  maxHeight = Number.MAX_SAFE_INTEGER

  constructor() {
    super()

    this.setPropertyTrigger('textContent', '', {
      trigger: value => {
        this.yogaNode.markDirty()
        this.setDirtyLayoutFlag()
        this.queueDirtyRect()
      },
    })
  }

  dimensions = { width: 0, height: 0 }
  textDimensions = { width: 0, height: 0 }
  lines = []

  getPreferredSize(maxWidth, widthMode, maxHeight, heightMode) {
    this.maxWidth = maxWidth
    this.maxHeight = maxHeight

    this.textLayout()

    return this.dimensions
  }

  textLayout() {
    const text = this.textContent

    const textWrap = this.style.wrap() ?? 'truncate-end'
    const wrappedText = wrapText(text, this.maxWidth, textWrap)
    this.lines = wrappedText.split('\n')

    this.textDimensions = measureText(wrappedText)

    this.dimensions.width = _.clamp(this.textDimensions.width, 0, this.maxWidth)
    this.dimensions.height = _.clamp(this.textDimensions.height, 0, this.maxHeight)

    assert(this.dimensions.width <= this.maxWidth)
    assert(this.dimensions.height <= this.maxHeight)

    this.queueDirtyRect()
  }

  getInternalContentWidth() {
    return this.textDimensions?.width
  }

  getInternalContentHeight() {
    return this.textDimensions?.height
  }

  cascadeLayout({ dirtyLayoutNodes = [], force = false } = {}) {
    super.cascadeLayout({ dirtyLayoutNodes, force })
    this.textLayout()
  }

  renderContent(x, y, l) {
    if (this.dimensions.height <= y) return this.renderBackground(l)

    let fullLine = y < this.dimensions.height ? this.lines[y] : ``
    let fullLineLength = fullLine.length

    let fullLineStart = 0

    if (this.style.textAlign() == 'center')
      fullLineStart = Math.floor((this.scrollRect.width - fullLineLength) / 2)

    if (this.style.textAlign() == 'right')
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
