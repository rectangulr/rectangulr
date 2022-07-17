import Yoga from 'yoga-layout'
import { Point, Rect, StyleManager } from '../../core'
import { TermElement } from './TermElement'

export class TextLayout2 {
    text = ''
    configuration = {
        width: 10,
    }

    lines = []

    setText(text) {
        this.text = text
    }

    update() {
        // const nbOfLines = this.text.length / this.configuration.width
        // this.lines = []
        // for (let i = 0; i < nbOfLines; i++) {
        //     const newLine = this.text.slice(this.configuration.width * i, this.configuration.width * (i + 1))
        //     this.lines.push(newLine)
        // }
        this.lines = [this.text]
    }

    setConfiguration(configuration) {
        this.configuration = configuration
    }

    getLine(y: string) {
        return this.lines[y]
    }

    getRowCount() {
        return this.lines.length
    }

    getColumnCount() {
        return this.configuration.width
    }
}

export class TermText2 extends TermElement {
    textContent: string
    styleManager: StyleManager
    textLayout: TextLayout2
    yogaNode: Yoga.YogaNode
    contentWorldRect: Rect
    scrollRect: Rect
    caretIndex: number
    activeElement: TermElement
    caret: Point
    caretMaxColumn: number
    contentRect: Rect
    elementRect: Rect
    enterIsNewline: boolean
    readOnly: boolean

    constructor() {
        super()

        this.textLayout = new TextLayout2()
        this.textLayout.update()

        this.setPropertyTrigger('textContent', '', {
            trigger: value => {
                this.textLayout.setText(value)
                this.textLayout.update()
                this.setDirtyLayoutFlag()
            },
        })

        this.addEventListener(`layout`, () => {
            if (this.style.$.display.serialize() == 'flex') {
                this.textLayout.configuration.width = this.contentRect.width
                this.textLayout.update()
            }
        })
    }

    appendChild(node) {
        throw new Error(`Failed to execute 'appendChild': This node does not support this method.`)
    }

    insertBefore(node) {
        throw new Error(`Failed to execute 'insertBefore': This node does not support this method.`)
    }

    removeChild(node) {
        throw new Error(`Failed to execute 'removeChild': This node does not support this method.`)
    }

    clearTextLayoutCache() {
        if (!this.textLayout) return

        this.textLayout.update()

        this.setDirtyLayoutFlag()
    }

    getPreferredSize(maxWidth) {
        this.textLayout.setConfiguration({ width: maxWidth })
        this.textLayout.update()

        let width = this.textLayout ? this.textLayout.getColumnCount() : 0

        let height = this.textLayout ? this.textLayout.getRowCount() : 0

        return { width, height }
    }

    getInternalContentWidth() {
        return this.textLayout ? this.textLayout.getColumnCount() : 0
    }

    getInternalContentHeight() {
        return this.textLayout ? this.textLayout.getRowCount() : 0
    }

    renderContent(x, y, l) {
        if (this.textLayout.getRowCount() <= y) return this.renderBackground(l)

        let fullLine = y < this.textLayout.getRowCount() ? this.textLayout.getLine(y) : ``
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
