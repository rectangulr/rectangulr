import { inject, Injector } from "@angular/core"
import { LogPointService } from "../../../logs/LogPointService"
import { assert } from "../../../utils/Assert"
import { assertDebug } from "../../../utils/utils"
import { Yoga } from "../layout/typeflex"
import { Frame } from "../paint/Frame"
import { StyleHandler } from "../style/StyleHandler"
import { Event } from './Event'
import { Node } from './Node'
import { Point } from './Point'
import { Rect } from './Rect'

const yogaConfig = Yoga.Config.create() as Yoga.Config

const cleanNode = Yoga.Node.createWithConfig(yogaConfig)

export class TermElement extends Node<TermElement> {
  static className: string
  name = 'element'

  dirtyStyle = true
  dirtyStyleQueued = false

  dirtyLayout = true
  dirtyLayoutQueued = false

  dirtyClip = true
  dirtyClipQueued = false

  dirtyRender = true
  dirtyRenderQueued = false

  elementRect = new Rect()
  contentRect = new Rect()
  scrollRect = new Rect()
  elementWorldRect = new Rect()
  contentWorldRect = new Rect()
  elementClipRect: Rect | null = new Rect()
  contentClipRect: Rect | null = new Rect()

  caret?: Point
  activeElement: TermElement | null = null

  style: StyleHandler
  yogaNode: Yoga.Node

  lp?: LogPointService = undefined

  constructor() {
    super()

    this.yogaNode = Yoga.Node.createWithConfig(yogaConfig)

    this.style = new StyleHandler(this, inject(Injector))

    this.setPropertyTrigger('caret', null, {
      validate: value => value === null || value instanceof Point,
      trigger: value => {
        this.rootNode?.requestRender()
      },
    })

  }

  // reset() {
  //   super.reset()
  //   // this.yogaNode = Yoga.Node.createWithConfig(yogaConfig)
  //   this.yogaNode.copyStyle(cleanNode)

  //   // @ts-ignore
  // this.yogaNode.setMeasureFunc((node, maxWidth, widthMode, maxHeight, heightMode) => this.measureFunc(maxWidth, widthMode, maxHeight, heightMode))

  //   // this.style = new StyleHandler(this, inject(Injector))
  //   // this.yogaNode.copyStyle(cleanNode.node)
  //   this.style.reset()

  //   this.activeElement = null
  //   resetRect(this.elementRect)
  //   resetRect(this.contentRect)
  //   resetRect(this.scrollRect)
  //   resetRect(this.elementWorldRect)
  //   resetRect(this.contentWorldRect)
  //   this.elementClipRect = this.elementWorldRect
  //   this.contentClipRect = this.contentWorldRect
  //   this.elementBoundingRect = null
  //   this.caret = null
  // }

  appendChild(node: TermElement) {
    if (!(node instanceof TermElement))
      throw new Error(`Failed to execute 'appendChild': Parameter 1 is not of type 'Element'.`)

    super.appendChild(node)
  }

  insertBefore(node: TermElement, referenceNode: TermElement) {
    if (!(node instanceof TermElement))
      throw new Error(`Failed to execute 'insertBefore': Parameter 1 is not of type 'Element'.`)

    super.insertBefore(node, referenceNode)
  }

  linkBefore(node: TermElement, referenceNode: TermElement) {
    super.linkBefore(node, referenceNode)

    // this.yogaNode.unsetMeasureFunc()
    this.yogaNode.insertChild(node.yogaNode, this.childNodes.indexOf(node))

    this.dirtyLayout = true
    this.dirtyClip = true

    if (this.rootNode) {
      node.traverse((n: TermElement) => {
        if (n.dirtyStyle && n.dirtyStyleQueued == false) {
          n.queueDirtyStyle()
        }

        if (n.dirtyLayout && n.dirtyLayoutQueued == false) {
          n.queueDirtyLayout()
        }

        if (n.dirtyClip && n.dirtyClipQueued == false) {
          n.queueDirtyClip()
        }

        if (n.dirtyRender && n.dirtyRenderQueued == false) {
          n.queueDirtyRender()
        }
      })
    }
  }

  removeChild(node: TermElement) {
    if (!(node instanceof TermElement))
      throw new Error(`Failed to execute 'removeChild': Parameter 1 is not of type 'Element'.`)

    super.removeChild(node)

    this.yogaNode.removeChild(node.yogaNode)
    // yes it's important
    // this.yogaNode.calculateLayout()

    if (this.childNodes.length === 0) {
      // @ts-ignore
      this.yogaNode.setMeasureFunc((node, maxWidth, widthMode, maxHeight, heightMode) => this.measureFunc(maxWidth, widthMode, maxHeight, heightMode))
    }

    this.queueDirtyLayout()
    this.queueDirtyClip()
    this.queueDirtyRender()

    // (this.rootNode as unknown as TermScreen).detachedNodes.push(node)

    // this.rootNode?.setDirtyNodeListFlag()
    // this.rootNode?.setDirtyRenderListFlag()

    // node.setDirtyLayoutFlag()
    // node.setDirtyClippingFlag()
    // node.dirtyLayout = true
    // node.dirtyClip = true

    // node.setDirtyNodeListFlag()
    // node.setDirtyFocusListFlag()
    // node.setDirtyRenderListFlag()

    // We need to manually register this rect because since the element will be removed from the tree, we will never iterate over it at the next triggerUpdates
    // this.rootNode?.queueDirtyRect(node.elementBoundingRect)
  }

  get scrollLeft() {
    this.triggerUpdates()

    return this.scrollRect.x
  }

  set scrollLeft(scrollLeft) {
    this.triggerUpdates()

    let previousScrollLeft = this.scrollRect.x
    let newScrollLeft = Math.max(
      0,
      Math.min(scrollLeft, this.scrollRect.width - this.elementRect.width)
    )

    if (previousScrollLeft !== newScrollLeft) {
      this.scrollRect.x = newScrollLeft

      this.queueDirtyClip()

      this.dispatchEvent(new Event('scroll'))
    }
  }

  get scrollTop() {
    this.triggerUpdates()

    return this.scrollRect.y
  }

  set scrollTop(scrollTop) {
    this.triggerUpdates()

    let previousScrollTop = this.scrollRect.y
    let newScrollTop = Math.max(
      0,
      Math.min(scrollTop, this.scrollRect.height - this.elementRect.height)
    )

    if (previousScrollTop !== newScrollTop) {
      this.scrollRect.y = newScrollTop

      this.queueDirtyClip()

      this.dispatchEvent(new Event('scroll'))
    }
  }

  get innerWidth() {
    this.triggerUpdates()
    return this.contentRect.width
  }

  get innerHeight() {
    this.triggerUpdates()
    return this.contentRect.height
  }

  // getCaretCoordinates() {
  //   if (this.rootNode !== this as any) {
  //     let worldCaret = this.rootNode.getCaretCoordinates()

  //     return worldCaret
  //   } else {
  //     if (!this.activeElement || !this.activeElement.contentClipRect || !this.activeElement.caret)
  //       return null

  //     let x =
  //       this.activeElement.contentWorldRect.x -
  //       this.activeElement.scrollRect.x +
  //       this.activeElement.caret.x
  //     let y =
  //       this.activeElement.contentWorldRect.y -
  //       this.activeElement.scrollRect.y +
  //       this.activeElement.caret.y

  //     if (
  //       x < this.activeElement.contentClipRect.x ||
  //       x >= this.activeElement.contentClipRect.x + this.activeElement.contentClipRect.width
  //     )
  //       return null

  //     if (
  //       y < this.activeElement.contentClipRect.y ||
  //       y >= this.activeElement.contentClipRect.y + this.activeElement.contentClipRect.height
  //     )
  //       return null

  //     return new Point({ x, y })
  //   }
  // }

  triggerUpdates() {
    this.rootNode?.updateDirtyNodes()
  }

  update() {
    if (this.style.dirty) {
      this.style.update()
    }

    if (this.dirtyLayout) {
      this.updateLayout()
    }

    if (this.dirtyClip) {
      this.updateClip()
    }
  }

  updateStyle() {
    this.lp?.logPoint('Update.Style', { name: this.name })
    this.style.update()
  }

  updateLayout() {
    assert(this.depth < 9999)
    this.lp?.logPoint('Update.Layout', { name: this.name })

    let doesElementRectChange = false
    {
      const prevElementRect = this.elementRect.clone()
      this.elementRect.x = Math.round(this.yogaNode.getComputedLeft())
      this.elementRect.y = Math.round(this.yogaNode.getComputedTop())

      this.elementRect.width = Math.round(this.yogaNode.getComputedWidth())
      this.elementRect.height = Math.round(this.yogaNode.getComputedHeight())

      assertDebug(this.elementRect.width < 9007199254740000)
      assert(this.elementRect.x % 1 == 0)
      assert(this.elementRect.y % 1 == 0)
      assert(this.elementRect.width % 1 == 0)
      assert(this.elementRect.height % 1 == 0)

      doesElementRectChange = !Rect.areEqual(this.elementRect, prevElementRect)
    }

    if (doesElementRectChange) {
      for (const child of this.childNodes) {
        child.updateLayout()
      }
    }

    let doesScrollChange = false
    if (doesElementRectChange) {

      const prevScroll = this.scrollRect.clone()
      this.scrollRect.width = Math.max(this.elementRect.width, this.getInternalContentWidth(), ... this.childNodes.map(child => {
        return child.elementRect.x + child.elementRect.width
      }))

      this.scrollRect.height = Math.max(this.elementRect.height, this.getInternalContentHeight(), ... this.childNodes.map(child => {
        return child.elementRect.y + child.elementRect.height
      }))
      assert(this.scrollRect.x % 1 == 0)
      assert(this.scrollRect.y % 1 == 0)
      assert(this.scrollRect.width % 1 == 0)
      assert(this.scrollRect.height % 1 == 0)

      doesScrollChange = !Rect.areEqual(prevScroll, this.scrollRect)
    }

    let doesContentRectChange = false
    {
      const prevContentRect = this.contentRect.clone()

      this.contentRect.x = (this.yogaNode.getComputedBorder(Yoga.EDGE_LEFT) ?? 0) + this.yogaNode.getComputedPadding(Yoga.EDGE_LEFT)
      this.contentRect.y = (this.yogaNode.getComputedBorder(Yoga.EDGE_TOP) ?? 0) + this.yogaNode.getComputedPadding(Yoga.EDGE_TOP)

      this.contentRect.width = this.scrollRect.width - this.contentRect.x - (this.yogaNode.getComputedBorder(Yoga.EDGE_RIGHT) ?? 0) - this.yogaNode.getComputedPadding(Yoga.EDGE_RIGHT)
      this.contentRect.height = this.scrollRect.height - this.contentRect.y - (this.yogaNode.getComputedBorder(Yoga.EDGE_BOTTOM) ?? 0) - this.yogaNode.getComputedPadding(Yoga.EDGE_BOTTOM)

      doesContentRectChange = !Rect.areEqual(this.contentRect, prevContentRect)
      if (doesContentRectChange || doesScrollChange) {
        this.queueDirtyClip()
      }
    }

    this.dirtyLayout = false
  }

  updateClip({ relativeClipRect = null } = {}) {
    this.lp?.logPoint('Update.Clip', { name: this.name })

    let doesScrollChange = false
    {
      let prevScroll = this.scrollRect.clone()

      this.scrollRect.x = Math.min(this.scrollRect.x, this.scrollRect.width - this.elementRect.width)
      this.scrollRect.y = Math.min(this.scrollRect.y, this.scrollRect.height - this.elementRect.height)

      doesScrollChange = !Rect.areEqual(prevScroll, this.scrollRect)
    }

    let doesElementRectChange = false
    {
      const prev = this.elementWorldRect.clone()

      let parentScroll = this.parentNode ? this.parentNode.scrollRect.clone() : new Rect()

      this.elementWorldRect.x = this.parentNode ? this.parentNode.elementWorldRect.x + this.elementRect.x - parentScroll.x : 0
      this.elementWorldRect.y = this.parentNode ? this.parentNode.elementWorldRect.y + this.elementRect.y - parentScroll.y : 0

      this.elementWorldRect.width = this.elementRect.width
      this.elementWorldRect.height = this.elementRect.height

      doesElementRectChange = !Rect.areEqual(this.elementWorldRect, prev)
    }

    let doesContentRectChange = false
    {
      let prev = this.contentWorldRect.clone()

      this.contentWorldRect.x = this.elementWorldRect.x + this.contentRect.x
      this.contentWorldRect.y = this.elementWorldRect.y + this.contentRect.y

      this.contentWorldRect.width = this.contentRect.width
      this.contentWorldRect.height = this.contentRect.height

      doesContentRectChange = !Rect.areEqual(this.contentWorldRect, prev)
    }

    let doesClipRectChange = false
    {
      let prev = this.elementClipRect ? this.elementClipRect.clone() : null
      this.elementClipRect = relativeClipRect ? Rect.getIntersectingRect(this.elementWorldRect, relativeClipRect) : this.elementWorldRect
      this.contentClipRect = relativeClipRect ? Rect.getIntersectingRect(this.contentWorldRect, relativeClipRect) : this.contentWorldRect
      doesClipRectChange = !Rect.areEqual(this.elementClipRect, prev)

      // if (this.parentNode && this.parentNode.elementClipRect && this.elementClipRect) {
      //   assert(includesRect(this.parentNode.elementClipRect, this.elementClipRect))
      // }
    }

    if (doesScrollChange || doesElementRectChange || doesContentRectChange || doesClipRectChange) {
      this.queueDirtyRender()
      if (!relativeClipRect) {
        relativeClipRect = this.elementClipRect
      }
      for (const child of this.childNodes) {
        child.updateClip({ relativeClipRect })
      }
    }
  }

  queueDirtyStyle(): boolean {
    this.dirtyStyle = true
    if (this.dirtyStyleQueued == false) {
      if (this.rootNode) {
        this.rootNode.dirtyStyleSet.add(this)
        this.dirtyStyleQueued = true
        this.rootNode.requestRender()
        return true
      } else {
        return false
      }
    }
    return false
  }

  queueDirtyLayout(): boolean {
    this.dirtyLayout = true
    if (this.dirtyLayoutQueued == false) {
      if (this.rootNode) {
        this.rootNode.dirtyLayoutSet.add(this)
        this.dirtyLayoutQueued = true
        this.rootNode.requestRender()
        return true
      } else {
        return false
      }
    }
    return false
  }

  queueDirtyClip(): boolean {
    this.dirtyClip = true
    if (this.dirtyClipQueued == false) {
      if (this.rootNode) {
        this.rootNode.dirtyClipSet.add(this)
        this.dirtyClipQueued = true
        this.rootNode.requestRender()
        return true
      } else {
        return false
      }
    }
    return false
  }

  queueDirtyRender(): boolean {
    this.dirtyRender = true
    if (this.dirtyRenderQueued == false) {
      if (this.rootNode) {
        this.rootNode.dirtyRenderSet.add(this)
        this.dirtyRenderQueued = true
        this.rootNode.requestRender()
        return true
      } else {
        return false
      }
    }
    return false
  }

  getInternalContentWidth(): number {
    return 0
  }

  getInternalContentHeight(): number {
    return 0
  }

  debugPaintRects = false

  render(renderMode: 'diff' | 'full', frame: Frame) {
    throw new Error(`Failed to execute 'render': Method not implemented.`)
  }

  // renderBackground(l) {
  //   if (l < 0) throw new Error(`Failed to execute 'renderBackground': Invalid length (${l}).`)

  //   if (l === 0) return ``

  //   if (this.rootNode.debugPaintRects) {
  //     return this.style.get('backgroundCharacter').repeat(l)
  //   }

  //   let background = ``

  //   if (this.style.get('backgroundColor')) {
  //     background += Color.back(this.style.get('backgroundColor'))
  //   }

  //   if (this.style.get('color')) {
  //     background += Color.front(this.style.get('color'))
  //   }

  //   background += this.style.get('backgroundCharacter').repeat(l)

  //   if (this.style.get('backgroundColor') || this.style.get('color')) {
  //     background += style.clear
  //   }

  //   return background
  // }


  scrollIntoView({
    align = 'auto',
    alignX = align,
    alignY = align,
    force = false,
    forceX = force,
    forceY = force,
    direction = 'xy',
  } = {}) {
    this.triggerUpdates()

    if (!this.parentNode) return

    if (this.caret) {
      let x = this.elementRect.x + this.contentRect.x + this.caret.x
      let y = this.elementRect.y + this.contentRect.y + this.caret.y

      this.parentNode.scrollCellIntoView(new Point({ x, y }), {
        alignX,
        alignY,
        forceX,
        forceY,
        direction,
      })
    } else {
      let effectiveAlignX = alignX
      let effectiveAlignY = alignY

      if (effectiveAlignX === 'auto')
        effectiveAlignX =
          Math.abs(this.elementRect.x - this.parentNode.scrollLeft) <
            Math.abs(
              this.elementRect.x +
              this.elementRect.width -
              1 -
              (this.parentNode.scrollLeft + this.parentNode.elementRect.width - 1)
            )
            ? 'start'
            : 'end'

      if (effectiveAlignY === 'auto')
        effectiveAlignY =
          Math.abs(this.elementRect.y - this.parentNode.scrollTop) <
            Math.abs(
              this.elementRect.y +
              this.elementRect.height -
              1 -
              (this.parentNode.scrollTop + this.parentNode.elementRect.height - 1)
            )
            ? 'start'
            : 'end'

      let x = this.elementRect.x
      let y = this.elementRect.y

      if (effectiveAlignX === 'end') x += this.elementRect.width - 1
      if (effectiveAlignY === 'end') y += this.elementRect.height - 1

      this.parentNode.scrollCellIntoView(new Point({ x, y }), {
        alignX,
        alignY,
        forceX,
        forceY,
        direction,
      })
    }
  }

  scrollCellIntoView(
    position,
    {
      align = 'auto',
      alignX = align,
      alignY = align,
      force = false,
      forceX = force,
      forceY = force,
      direction = 'xy',
    } = {}
  ) {
    this.triggerUpdates()

    const scroll = this.style.get('scroll')

    if (direction?.includes('x') && scroll?.includes('x')) {
      let effectiveAlignX = alignX

      if (effectiveAlignX === 'auto') {
        effectiveAlignX =
          Math.abs(position.x - this.scrollLeft) <
            Math.abs(position.x - (this.scrollLeft + this.elementRect.width - 1))
            ? 'start'
            : 'end'
      }

      if (
        forceX ||
        position.x < this.scrollLeft ||
        position.x >= this.scrollLeft + this.elementRect.width
      ) {
        switch (effectiveAlignX) {
          case 'start':
            {
              this.scrollLeft = position.x
            }
            break

          case 'end':
            {
              this.scrollLeft = position.x - this.elementRect.width + 1
            }
            break
        }
      }
    }

    if (direction?.includes('y') && scroll?.includes('y')) {
      let effectiveAlignY = alignY

      if (effectiveAlignY === 'auto') {
        effectiveAlignY =
          Math.abs(position.y - this.scrollTop) <
            Math.abs(position.y - (this.scrollTop + this.elementRect.height - 1))
            ? 'start'
            : 'end'
      }

      if (
        forceY ||
        position.y < this.scrollTop ||
        position.y >= this.scrollTop + this.elementRect.height
      ) {
        switch (effectiveAlignY) {
          case 'start':
            {
              this.scrollTop = position.y
            }
            break

          case 'end':
            {
              this.scrollTop = position.y - this.elementRect.height + 1
            }
            break
        }
      }
    }

    if (this.parentNode) {
      let x = this.elementRect.x + position.x - this.scrollRect.x
      let y = this.elementRect.y + position.y - this.scrollRect.y

      this.parentNode.scrollCellIntoView(new Point({ x, y }), { alignX, alignY, direction })
    }
  }

  scrollColumnIntoView(column, { align = 'auto', force = false } = {}) {
    this.scrollCellIntoView(new Point({ x: column, y: this.scrollTop }), {
      alignX: align,
      forceX: force,
    })
  }

  scrollRowIntoView(row, { align = 'auto', force = false } = {}) {
    this.scrollCellIntoView(new Point({ x: this.scrollLeft, y: row }), {
      alignY: align,
      forceY: force,
    })
  }

}

// These methods get added by EventSource.setup(this)
// export interface Element {
//   addEventListener(arg0: string, arg1: (e: any) => void, arg2?: { capture: true })
//   removeEventListener(arg0: string, callback: (event: any) => boolean | void)
//   dispatchEvent(arg0: Event & { mouse: any }, options?)
//   declareEvent(eventName: string)
// }

function resetRect(rect: Rect) {
  rect.x = 0
  rect.y = 0
  rect.height = 0
  rect.width = 0
}
