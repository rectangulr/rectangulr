import cliTruncate from 'cli-truncate'
import widestLine from 'widest-line'
import wrapAnsi from 'wrap-ansi'
import { LogPointService } from '../../../../../logs/LogPointService'
import { onChange } from '../../../../../utils/reactivity'
import { AnyObject, assert } from '../../../../../utils/utils'
import { TermElement } from "../../core/dom/TermElement"
import { flags } from '../../core/dom/flags'

export class TermText2 extends TermElement {
  static elementName = 'text'
  name = 'text'
  textContent = ''
  lines = []

  internalDimensions = { width: 0, height: 0 }
  conf: AnyObject = {
    maxWidth: Number.MAX_SAFE_INTEGER,
    maxHeight: Number.MAX_SAFE_INTEGER,
    wrap: null,
  }

  dirtyTextLayout = false

  lp?: LogPointService = undefined

  constructor() {
    super()

    this.style.add({
      minHeight: 1,
      flexDirection: 'row',
      flexShrink: 0,
    })

    onChange(this, 'textContent', () => {
      this.lp?.logPoint('TextContentChanged', { textContent: this.textContent })
      this.setDirtyTextLayout()
    })
  }

  setDirtyTextLayout() {
    this.setDirtyLayoutFlag()
    this.queueDirtyRect()
    this.yogaNode.markDirty()
    this.dirtyTextLayout = true
    this.lp?.logPoint('DirtyTextLayout')
  }

  setLayoutConfig(configuration: AnyObject) {
    Object.assign(this.conf, configuration)
    this.setDirtyTextLayout()
  }

  computeLayout() {
    const wrap = this.style.get('wrap')
    if (wrap) {
      const wrappedText = wrapText(this.textContent, this.conf.maxWidth, wrap)
      this.lines = wrappedText.split('\n')
      this.internalDimensions = measureText(wrappedText)
      // this.yogaNode.setFlexShrink(1)
    } else {
      this.lines = this.textContent.split('\n')
      this.internalDimensions = measureText(this.textContent)
      // this.yogaNode.setFlexShrink(0)
    }
    // this.yogaNode.markDirty()
    // this.setDirtyLayoutFlag()
    // this.queueDirtyRect()
    this.dirtyTextLayout = false
    this.lp?.logPoint('TermText.ComputeLayout', { dimensions: this.internalDimensions })
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

    if (this.dirtyTextLayout) {
      this.computeLayout()
    }

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
    assert(!(this.flags & flags.ELEMENT_HAS_DIRTY_LAYOUT))

    if (this.getInternalContentHeight() <= y) return this.renderBackground(l)

    let fullLine = y < this.getInternalContentHeight() ? this.getLine(y) : ``
    let fullLineLength = fullLine.length

    let fullLineStart = 0

    if (this.style.get('textAlign') == 'center')
      fullLineStart = Math.floor((this.scrollRect.width - fullLineLength) / 2)

    if (this.style.get('textAlign') == 'right')
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
