import { Injector, inject } from "@angular/core"
import * as _ from "@s-libs/micro-dash"
import * as Yoga from 'typeflex'
import type * as TYoga from '../../../yoga-types/index'
import { TermElement } from '../../term/elements/TermElement'
import { Event } from '../misc/Event'
import { Point } from '../misc/Point'
import { Rect } from '../misc/Rect'
import { Node } from './Node'
import { StyleHandler } from "./StyleHandler"
import { Position, } from "./StyleHelpers"
import { flags } from './flags'

const yogaConfig = Yoga.Config.create() as TYoga.Config
yogaConfig.setPointScaleFactor(2)

const cleanNode = Yoga.Node.createWithConfig(yogaConfig)

export class Element extends Node {
  name = 'element'
  flags = flags.ELEMENT_HAS_DIRTY_NODE_LIST | flags.ELEMENT_HAS_DIRTY_LAYOUT
  dirtyRects: Rect[] = []
  nodeList: Element[] = []
  focusList: Element[] = []
  renderList: TermElement[] = []
  activeElement: Element = null
  /** Position & size of the whole element inside its parent. Comes from Yoga.getComputed{Left,Top,Width,Height} */
  elementRect: Rect = new Rect()
  /** Position & size of the content box inside the element. Comes from Yoga.getComputedBorder(...) */
  contentRect: Rect = new Rect()
  /** Position & size of the element children box | note: xy 'x' and 'y' are "wrong", in that they are not the actual box offset (which would always be 0;0), but rather the scroll offset (ie = scrollLeft / scrollTop) */
  scrollRect: Rect = new Rect()
  /** Position & size of the element inside the viewport */
  elementWorldRect: Rect = new Rect()
  /** Position & size of the element content inside the viewport */
  contentWorldRect: Rect = new Rect()
  /** Position & size of the actual visible box inside the element */
  elementClipRect: Rect = this.elementWorldRect
  /** Used to check if the caret is visible */
  contentClipRect: Rect = this.contentWorldRect
  /** Position & size of the visible box that contains xy the element itself and each of its children */
  elementBoundingRect: Rect = null
  caret: Point

  eventListeners: { [name: string]: Function[] } = {}

  style: StyleHandler
  yogaNode: TYoga.Node

  constructor() {
    super()

    this.yogaNode = Yoga.Node.createWithConfig(yogaConfig)

    // @ts-ignore
    this.yogaNode.setMeasureFunc((node, maxWidth, widthMode, maxHeight, heightMode) => this.getPreferredSize(maxWidth, widthMode, maxHeight, heightMode))
    this.style = new StyleHandler(this, inject(Injector))

    this.setPropertyTrigger('caret', null, {
      validate: value => value === null || value instanceof Point,
      trigger: value => {
        this.rootNode?.requestUpdates()
      },
    })

  }

  reset() {
    super.reset()
    // this.yogaNode = Yoga.Node.createWithConfig(yogaConfig)
    // @ts-ignore
    // this.yogaNode.setMeasureFunc((node, maxWidth, widthMode, maxHeight, heightMode) => this.getPreferredSize(maxWidth, widthMode, maxHeight, heightMode))

    // this.style = new StyleHandler(this, inject(Injector))
    // this.yogaNode.copyStyle(cleanNode.node)
    this.style.reset()

    this.dirtyRects = []
    this.nodeList = []
    this.focusList = []
    this.renderList = []
    this.activeElement = null
    resetRect(this.elementRect)
    resetRect(this.contentRect)
    resetRect(this.scrollRect)
    resetRect(this.elementWorldRect)
    resetRect(this.contentWorldRect)
    this.elementClipRect = this.elementWorldRect
    this.contentClipRect = this.contentWorldRect
    this.elementBoundingRect = null
    this.caret = null
  }

  addEventListener(name: string, func: (e: Event) => void, options?: { bubbles: true }) {
    if (!this.eventListeners[name]) {
      this.eventListeners[name] = []
    } else {
      this.eventListeners[name].push(func)
    }

    return () => {
      this.removeEventListener(name, func)
    }
  }

  removeEventListener(name: string, func: (e: Event) => void) {
    _.remove(this.eventListeners[name], f => f == func)
  }

  dispatchEvent(event: Event, options?) {
    const listeners = this.eventListeners[event.name]
    if (listeners) {
      for (const listener of listeners) {
        listener(event)
      }
    }

    if (this.parentNode) {
      this.parentNode.dispatchEvent(event)
    }
  }

  toString({ depth = 0 } = {}) {
    // let tag = '${this.nodeName}#${this.id}${Array.from(this.classList).map(className => '.${className}').join('')}'
    let tag = `${this.nodeName}#${this.id}`

    if (depth <= 0) {
      return `<${tag}>`
    } else if (this.childNodes.length === 0) {
      return `<${tag} />`
    } else {
      let children = []

      for (let child of this.childNodes)
        children.push(child.toString({ depth: depth - 1 }).replace(/^/gm, '  '))

      return `<${tag}>\n${children.join('\n')}\n</${tag}>`
    }
  }

  appendChild(node) {
    if (!(node instanceof Element))
      throw new Error(`Failed to execute 'appendChild': Parameter 1 is not of type 'Element'.`)

    super.appendChild(node)
  }

  insertBefore(node: TermElement, referenceNode) {
    if (!(node instanceof Element))
      throw new Error(`Failed to execute 'insertBefore': Parameter 1 is not of type 'Element'.`)

    super.insertBefore(node, referenceNode)
  }

  linkBefore(node: TermElement, referenceNode) {
    // node.flushDirtyRects()

    super.linkBefore(node, referenceNode)

    this.yogaNode.unsetMeasureFunc()
    this.yogaNode.insertChild(node.yogaNode, this.childNodes.indexOf(node))

    this.setDirtyLayoutFlag()
    this.setDirtyClippingFlag()

    this.rootNode.setDirtyNodeListFlag()
    this.rootNode.setDirtyRenderListFlag()

    node.clearDirtyNodeListFlag()
    node.clearDirtyRenderListFlag()
  }

  removeChild(node: TermElement) {
    if (!(node instanceof Element))
      throw new Error(`Failed to execute 'removeChild': Parameter 1 is not of type 'Element'.`)

    super.removeChild(node)

    this.yogaNode.removeChild(node.yogaNode)
    // yes it's important
    this.yogaNode.calculateLayout()

    if (this.childNodes.length === 0) {
      // @ts-ignore
      this.yogaNode.setMeasureFunc((node, maxWidth, widthMode, maxHeight, heightMode) => this.getPreferredSize(maxWidth, widthMode, maxHeight, heightMode))
    }

    this.setDirtyLayoutFlag()
    this.setDirtyClippingFlag()

    // (this.rootNode as unknown as TermScreen).detachedNodes.push(node)

    this.rootNode.setDirtyNodeListFlag()
    this.rootNode.setDirtyRenderListFlag()

    node.setDirtyLayoutFlag()
    node.setDirtyClippingFlag()

    node.setDirtyNodeListFlag()
    // node.setDirtyFocusListFlag()
    node.setDirtyRenderListFlag()

    // We need to manually register this rect because since the element will be removed from the tree, we will never iterate over it at the next triggerUpdates
    this.rootNode.queueDirtyRect(node.elementBoundingRect)
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

      this.setDirtyClippingFlag()
      this.queueDirtyRect()

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

      this.setDirtyClippingFlag()
      this.queueDirtyRect()

      this.dispatchEvent(new Event('scroll'))
    }
  }

  get scrollWidth() {
    this.triggerUpdates()

    return this.scrollRect.width
  }

  get scrollHeight() {
    this.triggerUpdates()

    return this.scrollRect.height
  }

  get offsetWidth() {
    this.triggerUpdates()

    return this.elementRect.width
  }

  get offsetHeight() {
    this.triggerUpdates()

    return this.elementRect.height
  }

  get innerWidth() {
    this.triggerUpdates()

    return this.contentRect.width
  }

  get innerHeight() {
    this.triggerUpdates()

    return this.contentRect.height
  }

  getCaretCoordinates() {
    if (this.rootNode !== this) {
      let worldCaret = this.rootNode.getCaretCoordinates()

      return worldCaret
    } else {
      if (!this.activeElement || !this.activeElement.contentClipRect || !this.activeElement.caret)
        return null

      let x =
        this.activeElement.contentWorldRect.x -
        this.activeElement.scrollRect.x +
        this.activeElement.caret.x
      let y =
        this.activeElement.contentWorldRect.y -
        this.activeElement.scrollRect.y +
        this.activeElement.caret.y

      if (
        x < this.activeElement.contentClipRect.x ||
        x >= this.activeElement.contentClipRect.x + this.activeElement.contentClipRect.width
      )
        return null

      if (
        y < this.activeElement.contentClipRect.y ||
        y >= this.activeElement.contentClipRect.y + this.activeElement.contentClipRect.height
      )
        return null

      return new Point({ x, y })
    }
  }

  getBoundingClientRect() {
    this.triggerUpdates()

    return this.elementWorldRect
  }

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

  setDirtyNodeListFlag() {
    this.setDirtyFlag(flags.ELEMENT_HAS_DIRTY_NODE_LIST)
  }

  clearDirtyNodeListFlag() {
    this.clearDirtyFlag(flags.ELEMENT_HAS_DIRTY_NODE_LIST)
  }

  setDirtyRenderListFlag() {
    this.setDirtyFlag(flags.ELEMENT_HAS_DIRTY_RENDER_LIST)
  }

  clearDirtyRenderListFlag() {
    this.clearDirtyFlag(flags.ELEMENT_HAS_DIRTY_RENDER_LIST)
  }

  setDirtyLayoutFlag() {
    this.setDirtyFlag(flags.ELEMENT_HAS_DIRTY_LAYOUT, flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN)
  }

  clearDirtyLayoutFlag() {
    this.clearDirtyFlag(flags.ELEMENT_HAS_DIRTY_LAYOUT)
  }

  clearDirtyLayoutChildrenFlag() {
    this.clearDirtyFlag(flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN)
  }

  setDirtyClippingFlag() {
    this.setDirtyFlag(flags.ELEMENT_HAS_DIRTY_CLIPPING, flags.ELEMENT_HAS_DIRTY_CLIPPING_CHILDREN)
  }

  clearDirtyClippingFlag() {
    this.clearDirtyFlag(flags.ELEMENT_HAS_DIRTY_CLIPPING)
  }

  clearDirtyClippingChildrenFlag() {
    this.clearDirtyFlag(flags.ELEMENT_HAS_DIRTY_CLIPPING_CHILDREN)
  }

  setDirtyFlag(flag, parentFlag = 0) {
    if (this.flags & flag) return

    this.flags |= flag

    if (parentFlag !== 0) {
      let parent = this.parentNode

      while (parent && !(parent.flags & parentFlag)) {
        parent.flags |= parentFlag
        parent = parent.parentNode
      }
    }

    this.rootNode?.requestUpdates()
  }

  clearDirtyFlag(flag) {
    this.flags &= ~flag
  }

  queueDirtyRect(dirtyRect = this.elementClipRect, checkIntersectionFrom = 0) {
    if (Rect.isEmpty(dirtyRect)) return

    if (this.rootNode !== this)
      return this.rootNode.queueDirtyRect(
        Rect.getIntersectingRect(dirtyRect, this.elementClipRect),
        checkIntersectionFrom
      )

    // Look if the dirtyRect intersects one that was already there
    let intersectorIndex = this.dirtyRects.findIndex(other => {
      return dirtyRect.intersectsRect(other)
    })

    // If it does, queue rects around the intersection
    if (intersectorIndex !== -1)
      this.queueDirtyRects(
        dirtyRect.excludeRect(this.dirtyRects[intersectorIndex]),
        intersectorIndex + 1
      )
    else {
      // assert(dirtyRect.x % 1 == 0)
      // assert(dirtyRect.y % 1 == 0)
      // assert(dirtyRect.width % 1 == 0)
      // assert(dirtyRect.height % 1 == 0)
      this.dirtyRects.push(dirtyRect)
    }

    this.rootNode.requestUpdates()
  }

  queueDirtyRects(dirtyRects, checkIntersectionFrom = 0) {
    if (!dirtyRects) return

    for (let dirtyRect of dirtyRects) {
      this.queueDirtyRect(dirtyRect, checkIntersectionFrom)
    }
  }

  flushDirtyRects() {
    if (this.rootNode !== this) {
      throw new Error(`Failed to execute 'queueDirtyRect': This function can only be called from a root node.`)
    }

    let dirtyRects = this.dirtyRects
    this.dirtyRects = []

    return dirtyRects
  }

  requestUpdates() {
    // The default implementation doesn't do anything; triggerUpdates has to be called manually.
    // However, it is expected that renderer will override this function and call triggerUpdates themselves.
    // Note that calling triggerUpdates synchronously isn't advised: the requestUpdates function might get called multiple times in the same execution list.
    // For this reason, prefer using setImmediate, requestAnimationFrame, or setTimeout in order to schedule an update later on.
  }

  triggerUpdates({ maxDepth = 5 } = {}) {
    if (this.rootNode !== this) return this.rootNode.triggerUpdates()

    let needsFullRerender =
      this.flags & (flags.ELEMENT_HAS_DIRTY_NODE_LIST | flags.ELEMENT_HAS_DIRTY_RENDER_LIST)

    if (this.flags & flags.ELEMENT_HAS_DIRTY_NODE_LIST) {
      this.nodeList = this.generateNodeList()
      this.clearDirtyNodeListFlag()
    }

    // if (this.flags & flags.ELEMENT_HAS_DIRTY_FOCUS_LIST) {
    //   this.focusList = this.generateFocusList()
    //   this.clearDirtyFocusListFlag()
    // }

    if (this.flags & flags.ELEMENT_HAS_DIRTY_RENDER_LIST) {
      this.renderList = this.generateRenderList()
      this.clearDirtyRenderListFlag()
    }

    let dirtyLayoutNodes = []
    let dirtyScrollNodes = []

    if (this.flags & (flags.ELEMENT_HAS_DIRTY_LAYOUT | flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN)) {
      this.yogaNode.calculateLayout()
      this.cascadeLayout({ dirtyLayoutNodes })
    }

    if (this.flags & (flags.ELEMENT_HAS_DIRTY_CLIPPING | flags.ELEMENT_HAS_DIRTY_CLIPPING_CHILDREN))
      this.cascadeClipping({ dirtyScrollNodes })

    if (this.flags & flags.ELEMENT_IS_DIRTY)
      throw new Error(
        `Aborted 'triggerUpdates' execution: Flags have not been correctly reset at some point (0b${(
          this.flags & flags.ELEMENT_IS_DIRTY
        )
          .toString(2)
          .padStart(16, '0')}).`
      )

    for (let dirtyLayoutNode of dirtyLayoutNodes) dirtyLayoutNode.dispatchEvent(new Event('layout'))

    for (let dirtyScrollNode of dirtyScrollNodes) dirtyScrollNode.dispatchEvent(new Event('scroll'))

    if (needsFullRerender) this.queueDirtyRect()

    if (this.flags & flags.ELEMENT_IS_DIRTY) {
      if (maxDepth < 1) {
        throw new Error(`Aborted 'triggerUpdates' execution: Too much recursion.`)
      } else {
        this.triggerUpdates({ maxDepth: maxDepth - 1 })
      }
    }
  }

  generateNodeList() {
    let nodeList = []
    let traverseList = [this as unknown as TermElement]

    while (!_.isEmpty(traverseList)) {
      let element = traverseList.shift()
      nodeList.push(element)

      traverseList = element.childNodes.concat(traverseList)
    }

    return nodeList
  }

  generateFocusList() {
    let focusList = []

    // for (let node of this.nodeList) if (node.style.get('focusEvents')) focusList.push(node)

    return focusList
  }

  generateRenderList() {
    let renderList = []
    let stackingContexts: Element[] = [this]

    while (stackingContexts.length > 0) {
      let stackingContext = stackingContexts.shift()
      renderList.push(stackingContext)

      let childNodes = stackingContext.childNodes.slice()
      let subContexts = []

      while (childNodes.length > 0) {
        let child = childNodes.shift()

        if (child.style.get('zIndex') != null) {
          subContexts.push(child)
        } else if (Position.isAbsolutelyPositioned(child.style.get('position'))) {
          subContexts.push(child)
        } else {
          renderList.push(child)
          childNodes.splice(0, 0, ...child.childNodes)
        }
      }

      stackingContexts.splice(
        0,
        0,
        ...subContexts.sort((a: Element, b: Element) => {
          return a.style.get('zIndex') - b.style.get('zIndex')
        })
      )
    }

    renderList.reverse()

    return renderList
  }

  cascadeLayout({ dirtyLayoutNodes = [], force = false } = {}) {
    if (
      force ||
      this.flags & (flags.ELEMENT_HAS_DIRTY_LAYOUT | flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN)
    ) {
      let doesLayoutChange = false
      let doesScrollChange = false

      if (force || this.flags & flags.ELEMENT_HAS_DIRTY_LAYOUT) {
        let prevElementRect = this.elementRect.clone()
        let prevContentRect = this.contentRect.clone()

        this.elementRect.x = Math.round(this.yogaNode.getComputedLeft())
        this.elementRect.y = Math.round(this.yogaNode.getComputedTop())

        this.elementRect.width = Math.round(this.yogaNode.getComputedWidth())
        this.elementRect.height = Math.round(this.yogaNode.getComputedHeight())

        // assert(this.elementRect.x % 1 == 0)
        // assert(this.elementRect.y % 1 == 0)
        // assert(this.elementRect.width % 1 == 0)
        // assert(this.elementRect.height % 1 == 0)

        // We try to optimize away the iterations inside elements that haven't changed and aren't marked as dirty, because we know their children's layouts won't change either
        doesLayoutChange = !Rect.areEqual(this.elementRect, prevElementRect)
      }

      if (
        this.flags & (flags.ELEMENT_HAS_DIRTY_LAYOUT | flags.ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN) ||
        doesLayoutChange
      ) {
        for (let child of this.childNodes as Element[]) child.cascadeLayout({ dirtyLayoutNodes, force: true })

        let prevScrollWidth = this.scrollRect.width
        let prevScrollHeight = this.scrollRect.height

        this.scrollRect.width = Math.max(this.elementRect.width, this.getInternalContentWidth())

        this.scrollRect.height = Math.max(this.elementRect.height, this.getInternalContentHeight())

        // assert(this.scrollRect.x % 1 == 0)
        // assert(this.scrollRect.y % 1 == 0)
        // assert(this.scrollRect.width % 1 == 0)
        // assert(this.scrollRect.height % 1 == 0)

        this.contentRect.x =
          this.yogaNode.getComputedBorder(Yoga.EDGE_LEFT) +
          this.yogaNode.getComputedPadding(Yoga.EDGE_LEFT)
        this.contentRect.y =
          this.yogaNode.getComputedBorder(Yoga.EDGE_TOP) +
          this.yogaNode.getComputedPadding(Yoga.EDGE_TOP)

        this.contentRect.width =
          this.scrollRect.width -
          this.contentRect.x -
          this.yogaNode.getComputedBorder(Yoga.EDGE_RIGHT) -
          this.yogaNode.getComputedPadding(Yoga.EDGE_RIGHT)
        this.contentRect.height =
          this.scrollRect.height -
          this.contentRect.y -
          this.yogaNode.getComputedBorder(Yoga.EDGE_BOTTOM) -
          this.yogaNode.getComputedPadding(Yoga.EDGE_BOTTOM)

        doesScrollChange =
          this.scrollRect.width !== prevScrollWidth || this.scrollRect.height !== prevScrollHeight
      }

      if (this.flags & flags.ELEMENT_HAS_DIRTY_LAYOUT || doesLayoutChange || doesScrollChange) {
        this.rootNode.queueDirtyRect(this.elementClipRect)

        // We register this node so that we can emit the "postlayout" event once the layout process has been completed
        dirtyLayoutNodes.push(this)

        // We need to use the silent option because otherwise we could end up triggering a new "dirty" event that would schedule a useless new update that would itself trigger a new update, etc.
        // this.setDirtyClippingFlag({ silent: true })
        this.setDirtyClippingFlag()
      }

      this.clearDirtyLayoutFlag()
      this.clearDirtyLayoutChildrenFlag()
    }
  }

  cascadeClipping({ dirtyScrollNodes = [], relativeClipRect = null, force = false } = {}) {
    if (
      force ||
      this.flags & (flags.ELEMENT_HAS_DIRTY_CLIPPING | flags.ELEMENT_HAS_DIRTY_CLIPPING_CHILDREN)
    ) {
      if (force || this.flags & flags.ELEMENT_HAS_DIRTY_CLIPPING) {
        let doesClippingChange = false
        let doesScrollChange = false

        let prevScrollX = this.scrollRect.x
        let prevScrollY = this.scrollRect.y

        if (this.style.get('scroll')) {
          this.scrollRect.x = Math.max(
            0,
            Math.min(this.scrollRect.x, this.scrollRect.width - this.elementRect.width)
          )
          this.scrollRect.y = Math.max(
            0,
            Math.min(this.scrollRect.y, this.scrollRect.height - this.elementRect.height)
          )
        } else {
          this.scrollRect.x = 0
          this.scrollRect.y = 0
        }

        doesScrollChange = this.scrollRect.x !== prevScrollX || this.scrollRect.y !== prevScrollY

        if (doesScrollChange) dirtyScrollNodes.push(this)

        let parentScrollX = this.parentNode?.scrollRect.x ?? 0
        let parentScrollY = this.parentNode?.scrollRect.y ?? 0

        let prevElementWorldRect = this.elementWorldRect.clone()

        this.elementWorldRect.x = this.parentNode
          ? this.parentNode.elementWorldRect.x + this.elementRect.x - parentScrollX
          : 0
        this.elementWorldRect.y = this.parentNode
          ? this.parentNode.elementWorldRect.y + this.elementRect.y - parentScrollY
          : 0

        this.elementWorldRect.width = this.elementRect.width
        this.elementWorldRect.height = this.elementRect.height

        let prevContentWorldRect = this.contentWorldRect.clone()

        this.contentWorldRect.x = this.elementWorldRect.x + this.contentRect.x
        this.contentWorldRect.y = this.elementWorldRect.y + this.contentRect.y

        this.contentWorldRect.width = this.contentRect.width
        this.contentWorldRect.height = this.contentRect.height

        let prevElementClipRect = this.elementClipRect ? this.elementClipRect.clone() : null

        this.elementClipRect = relativeClipRect
          ? Rect.getIntersectingRect(this.elementWorldRect, relativeClipRect)
          : this.elementWorldRect
        this.contentClipRect = relativeClipRect
          ? Rect.getIntersectingRect(this.contentWorldRect, relativeClipRect)
          : this.contentWorldRect

        doesClippingChange =
          !Rect.areEqual(prevElementWorldRect, this.elementWorldRect) ||
          !Rect.areEqual(prevContentWorldRect, this.contentWorldRect) ||
          !Rect.areEqual(prevElementClipRect, this.elementClipRect)

        if (doesClippingChange || doesScrollChange) {
          if (doesClippingChange) this.rootNode.queueDirtyRect(prevElementClipRect)

          this.rootNode.queueDirtyRect(this.elementClipRect)
        }
      }

      if (this.style.get('scroll') || !relativeClipRect) relativeClipRect = this.elementClipRect

      for (let child of this.childNodes) {
        child.cascadeClipping({
          dirtyScrollNodes,
          relativeClipRect,
          // @ts-ignore
          force: force || this.flags & flags.ELEMENT_HAS_DIRTY_CLIPPING,
        })
      }

      this.elementBoundingRect = Rect.getBoundingRect(
        this.elementClipRect,
        ...this.childNodes.map(child => child.elementBoundingRect)
      )

      this.clearDirtyClippingFlag()
      this.clearDirtyClippingChildrenFlag()
    }
  }

  getElementRects() {
    return _.pick(this,)
  }

  getPreferredSize(maxWidth, widthMode, maxHeight, heightMode) {
    return { width: maxWidth, height: 0 }
  }

  /** The max of the children's elementRect.(x+width) */
  getInternalContentWidth() {
    // if (this.childNodes.length == 1) {
    //   const child = this.childNodes[0]
    //   return child.getInternalContentWidth()
    // } else {
    return Math.max(
      ...this.childNodes.map(child => {
        return child.elementRect.x + child.elementRect.width
      })
    )
    // }
  }

  getInternalContentHeight() {
    // if (this.childNodes.length == 1) {
    //   const child = this.childNodes[0]
    //   return child.getInternalContentHeight()
    // } else {
    return Math.max(
      ...this.childNodes.map(child => {
        return child.elementRect.y + child.elementRect.height
      })
    )
    // }
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
