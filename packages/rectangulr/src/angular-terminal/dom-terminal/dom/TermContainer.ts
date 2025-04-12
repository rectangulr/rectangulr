import { Frame } from "../paint/Frame"
import { TermElement } from "./TermElement"

export class TermContainer extends TermElement {
  static className = 'container'
  name = 'container'

  measureFunc(maxWidth, widthMode, maxHeight, heightMode) {
    return { width: maxWidth, height: 0 }
  }

  getInternalContentWidth(): number {
    return 0
  }

  getInternalContentHeight(): number {
    return 0
  }

  render(renderMode: 'diff' | 'full', frame: Frame) {
    // assertDebug(this.elementRect.width > 0 && this.elementRect.height > 0)
    // if (this.parentNode) {
    //   assert(includesRect(this.parentNode.elementWorldRect, this.elementWorldRect))
    // }
    if (false && this.childNodes.length > 0) {
      // check that the elementRects are not the same x,y between siblings
      for (const child of this.childNodes) {
        for (const sibling of this.childNodes) {
          if (child != sibling && child.elementRect.width != 0 && child.elementRect.x == sibling.elementRect.x && child.elementRect.y == sibling.elementRect.y) {
            debugger
          }
        }
      }
    }
    const bg = this.style.get('backgroundColor')
    const fg = this.style.get('color')

    if (this.elementClipRect) {
      for (let y = 0; y < this.elementClipRect.height; y++) {
        for (let x = 0; x < this.elementClipRect.width; x++) {
          let char = ' '
          frame.updateCellWithBounds({ bounds: this.elementClipRect, x, y, props: { char, fg: fg, bg: bg } })
        }
      }
    }
    for (const child of this.childNodes) {
      if (renderMode == 'full' || renderMode == 'diff' && child.dirtyRender) {
        child.render(renderMode, frame)
      }
    }
  }

}
