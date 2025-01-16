import _ from 'lodash-es'
import { assert } from '../../../../../utils/utils'

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
    // this.lines = this.text.split('\n')
    // if (this.lines.length > 5) debugger
    this.lines = []

    const nbOfLines = Number(this.text.length / this.maxWidth)
    assert(nbOfLines < 10000)

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
    return _.max(this.lines.map(l => l.length))
  }
}
