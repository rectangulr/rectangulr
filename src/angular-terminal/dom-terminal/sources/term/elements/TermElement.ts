import { style } from '@manaflair/term-strings'
import { Element } from '../../core/dom/Element'
import { KeySequence } from '../misc/KeySequence'
import { BackgroundClip, Color } from '../../core/dom/StyleHelpers'

export class TermElement extends Element {
  static elementName = 'element'

  debugPaintRects = false

  constructor() {
    super()
    this.reset()
  }

  reset() {
    super.reset()
    this.style.reset()
  }

  addShortcutListener(descriptors, callback, { capture = false } = {}) {
    if (!capture)
      throw new Error(
        `Failed to execute 'addShortcutListener': The 'capture' option needs to be set when adding a shortcut.`
      )

    for (let descriptor of descriptors.split(/,/g)) {
      let sequence = new KeySequence(descriptor)

      this.addEventListener(
        `keypress`,
        e => {
          if (!e.key) return

          if (sequence.add(e.key)) {
            callback.call(this, e)
          }
        }
      )
    }
  }

  // click(mouse) {
  //   this.dispatchEvent(Object.assign(new Event(`click`), { mouse }))
  // }

  renderElement(x, y, l) {
    let processBorders = (x, y, l) => {
      let prepend = ``
      let append = ``

      if (y === 0 && this.style.get('borderTopCharacter')) {
        let contentL = l

        if (x === 0 && this.style.get('borderLeftCharacter')) {
          prepend = this.style.get('borderTopLeftCharacter')
          contentL -= 1
        }

        if (x + l === this.elementRect.width && this.style.get('borderRightCharacter')) {
          append = this.style.get('borderTopRightCharacter')
          contentL -= 1
        }

        let data = prepend + this.style.get('borderTopCharacter').repeat(contentL) + append

        if (!this.rootNode.debugPaintRects && BackgroundClip.doesIncludeBorders(this.style.get('backgroundClip'))) {
          const backgroundColor = this.style.get('backgroundColor')
          const backgroundAnsi = Color.front(backgroundColor)
          data = backgroundAnsi + data
        }

        if (!this.rootNode.debugPaintRects && this.style.get('borderColor')) {
          data = Color.front(this.style.get('borderColor')) + data
        }

        if (!this.rootNode.debugPaintRects && ((BackgroundClip.doesIncludeBorders(this.style.get('backgroundClip'))) ||
          this.style.get('borderColor'))
        ) {
          data += style.clear
        }

        return data
      } else if (y === this.elementRect.height - 1 && this.style.get('borderBottomCharacter')) {
        let contentL = l

        if (x === 0 && this.style.get('borderLeftCharacter')) {
          prepend = this.style.get('borderBottomLeftCharacter')
          contentL -= 1
        }

        if (x + l === this.elementRect.width && this.style.get('borderRightCharacter')) {
          append = this.style.get('borderBottomRightCharacter')
          contentL -= 1
        }

        let data = prepend + this.style.get('borderBottomCharacter').repeat(contentL) + append

        if (!this.rootNode.debugPaintRects &&
          BackgroundClip.doesIncludeBorders(this.style.get('backgroundClip'))) {
          data = Color.back(this.style.get('backgroundColor')) + data
        }

        if (!this.rootNode.debugPaintRects && this.style.get('borderColor')) {
          data = Color.front(this.style.get('borderColor')) + data
        }

        if (!this.rootNode.debugPaintRects && ((this.style.get('backgroundColor') &&
          BackgroundClip.doesIncludeBorders(this.style.get('backgroundClip'))) || this.style.get('borderColor'))) {
          data += style.clear
        }

        return data
      } else {
        let contentX = x
        let contentY = y
        let contentL = l

        if (this.style.get('borderLeftCharacter')) {
          if (x === 0) {
            prepend = this.style.get('borderLeftCharacter')
            contentX += 1
            contentL -= 1
          } else {
            contentX -= 1
          }
        }

        if (this.style.get('borderRightCharacter')) {
          if (x + l === this.elementRect.width) {
            append = this.style.get('borderRightCharacter')
            contentL -= 1
          }
        }

        if (BackgroundClip.doesIncludeBorders(this.style.get('backgroundClip'))) {
          if (prepend) prepend = Color.back(this.style.get('backgroundColor')) + prepend

          if (append) {
            append = Color.back(this.style.get('backgroundColor')) + append
          }
        }

        if (this.style.get('borderColor')) {
          if (prepend) prepend = Color.front(this.style.get('borderColor')) + prepend

          if (append) {
            append = Color.front(this.style.get('borderColor')) + append
          }
        }

        if ((BackgroundClip.doesIncludeBorders(this.style.get('backgroundClip'))) ||
          this.style.get('borderColor')) {
          if (prepend) prepend += style.clear

          if (append) {
            append += style.clear
          }
        }

        return (
          prepend +
          processContent(contentX + this.scrollRect.x, contentY + this.scrollRect.y, contentL) +
          append
        )
      }
    }

    let processContent = (x, y, l) => {
      if (y < this.contentRect.y || y >= this.contentRect.y + this.contentRect.height) {
        return this.renderBackground(l)
      } else {
        y -= this.contentRect.y
      }

      let prepend = ``
      let append = ``

      if (x < this.contentRect.x) {
        let size = Math.min(l, this.contentRect.x - x)
        prepend = this.renderBackground(size)
          ; (x = 0), (l -= size)
      } else {
        x -= this.contentRect.x
      }

      if (x + l > this.contentRect.width) {
        let size = Math.min(l, x + l - this.contentRect.width)
        append = this.renderBackground(size)
        l -= size
      }

      let content = this.renderContent(x, y, l)

      return prepend + content + append
    }

    return processBorders(x, y, l)
  }

  renderContent(x, y, l) {
    return this.renderBackground(l)
  }

  renderBackground(l) {
    if (l < 0) throw new Error(`Failed to execute 'renderBackground': Invalid length (${l}).`)

    if (l === 0) return ``

    if (this.rootNode.debugPaintRects) { return this.style.get('backgroundCharacter').repeat(l) }

    let background = ``

    if (this.style.get('backgroundColor')) { background += Color.back(this.style.get('backgroundColor')) }

    if (this.style.get('color')) { background += Color.front(this.style.get('color')) }

    background += this.style.get('backgroundCharacter').repeat(l)

    if (this.style.get('backgroundColor') || this.style.get('color')) { background += style.clear }

    return background
  }

  renderText(text) {
    if (this.rootNode.debugPaintRects) return text

    let prefix = ``
    let suffix = ``

    if (this.style.get('fontWeight') == 'fainted') { prefix += style.fainted.in }
    else if (this.style.get('fontWeight') == 'bold') { prefix += style.emboldened.in }
    if (this.style.get('textDecoration') == 'underline') { prefix += style.underlined.in }

    if (this.style.get('backgroundColor')) { prefix += Color.back(this.style.get('backgroundColor')) }

    if (this.style.get('color')) { prefix += Color.front(this.style.get('color')) }

    if (prefix.length !== 0) { suffix += style.clear }

    return prefix + text + suffix
  }
}
