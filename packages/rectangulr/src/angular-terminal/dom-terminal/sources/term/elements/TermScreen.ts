import { Injectable, NgZone, inject, signal } from '@angular/core'
import { isBoolean, isEmpty } from '@s-libs/micro-dash'
import z from 'zod'
import { cursor, feature, screen, style } from '../../../../../term-strings/core'
import { Key } from '../../../../../term-strings/parse'
import { Parser, Production } from '../../../../../term-strings/parse/parser/Parser'
import { sequences } from '../../../../../term-strings/parse/sequences'
import { assert } from '../../../../../utils/utils'
import { LOGGER } from '../../../../logger'
import { TERMINAL } from '../../../../terminals/terminal'
import { Event, Point, Rect } from '../../core'
import { TermElement } from '../../core/dom/Element'
import { isInsideOf } from '../../core/dom/Node'
import { flags } from '../../core/dom/flags'
import { ElementPool } from './element-pool'

@Injectable({
  providedIn: 'root'
})
export class TermScreen extends TermElement {
  terminal = inject(TERMINAL)
  logger = inject(LOGGER)
  elementPool = inject(ElementPool)
  ngZone = inject(NgZone)

  /** We keep track of whether the screen is fully setup or not (has stdin/stdout) */
  ready = false
  /**  Our subscription to the input events */
  subscription: any = null
  /** A timer used to trigger layout / clipping / render updates after a node becomes dirty */
  updateTimer: any = null
  trackScreenSize = false
  mouseOverElement: TermElement | null = null
  mouseEnterElements: TermElement[] = []
  caret: Point = null as any
  // detachedNodes: Element[] = []
  parser: Parser
  decoder = new TextDecoder()
  size = signal({ width: 0, height: 0 })

  // recycledThisTick = 0

  constructor() {
    super()
    this.rootNode = this
    this.depth = 0

    this.style.add({
      position: 'relative',
      width: 0,
      height: 0,
      // overflow: `hidden`,
      scroll: null,
    })

    this.parser = new Parser(input => {
      // @ts-ignore
      this.handleInput(input)
    })
    for (const registration of sequences) {
      this.parser.register(...registration)
    }

    // Bind the listeners that will convert the "mousemove" events into "mouseover" / "mouseout" / "mouseenter" / "mouseleave"
    this.addEventListener(`mousemove`, e => this.dispatchMouseOverEvents(e))
    this.addEventListener(`mousemove`, e => this.dispatchMouseEnterEvents(e))

    // Bind the listeners that enable navigating between focused elements
    // this.addShortcutListener(`S-tab`, e => e.setDefault(() => this.focusPreviousElement()), {
    //   capture: true,
    // })
    // this.addShortcutListener(`tab`, e => e.setDefault(() => this.focusNextElement()), {
    //   capture: true,
    // })

    // Bind the listener that exit the application on C-c
    // this.addShortcutListener(`C-c`, (e: any) => this.terminate(), { capture: true })

    this.setPropertyTrigger(`debugPaintRects`, false, {
      validate: value => isBoolean(value),
      trigger: value => {
        this.queueDirtyRect()
      },
    })
  }

  requestUpdates() {
    if (this.updateTimer) return

    this.updateTimer = setTimeout(() => {
      if (!this.ready) return

      this.updateTimer = null
      this.renderScreen()
    }, 0)
  }

  triggerUpdates({ maxDepth = 5 } = {}) {

    this.computeStyles()

    let needsFullRerender =
      this.flags & (flags.ELEMENT_HAS_DIRTY_NODE_LIST | flags.ELEMENT_HAS_DIRTY_RENDER_LIST)

    if (this.flags & flags.ELEMENT_HAS_DIRTY_NODE_LIST) {
      this.nodeList = this.generateNodeList()
      this.clearDirtyNodeListFlag()
    }

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

    // this.computeTextLayout()

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

  attachScreen(trackOutputSize = true, throttleMouseMoveEvents = 1000 / 60) {
    if (this.ready) throw new Error(`Failed to execute 'setup': This screen is already in use.`)

    this.ready = true

    this.trackScreenSize = trackOutputSize

    // Automatically clear the screen when the program exits
    if (RECTANGULR_TARGET == 'node') {
      process.on(`uncaughtException`, () => { this.handleException })
      process.on(`exit`, () => { this.handleExit })
    }

    this.terminal.inputs.subscribe(input => {
      if (input.type == 'raw') {
        RawInputType.parse(input)
        this.parser.feed(input.buffer)
      } else {
        this.handleInput(input)
      }
    })

    // Automatically resize the screen when its output changes
    {
      this.style.add(this.size)
      this.size.set(this.terminal.screen.size())

      this.terminal.screen.on('resize', size => {
        this.size.set(this.terminal.screen.size())
        console.log(this.size())
      })
    }

    // If we can operate in raw mode, we do
    if (RECTANGULR_TARGET == 'node') {
      this.terminal.inputs.setRawMode?.(true)
    }

    // Enter the alternate screen
    this.writeToTerminal(screen.alternateScreen.in)

    // Disable the terminal soft wrapping
    this.writeToTerminal(screen.noWrap.in)

    // Hide the cursor (it will be renderer with everything else later)
    this.writeToTerminal(cursor.hidden)

    // Enable mouse tracking (all events are tracked, even when the mouse button isn't pressed)
    this.writeToTerminal(feature.enableMouseHoldTracking.in)
    this.writeToTerminal(feature.enableMouseMoveTracking.in)
    this.writeToTerminal(feature.enableExtendedCoordinates.in)

    // Clear the current font style so that we aren't polluted by previous applications
    this.writeToTerminal(style.clear)

    // Finally schedule the first update of the screen
    this.requestUpdates()
  }

  releaseScreen() {
    if (!this.ready) return

    // Disable the various mouse tracking modes
    this.writeToTerminal(feature.enableExtendedCoordinates.out)
    this.writeToTerminal(feature.enableMouseMoveTracking.out)
    this.writeToTerminal(feature.enableMouseHoldTracking.out)

    // Display the cursor back
    this.writeToTerminal(cursor.normal)

    // Exit the alternate screen
    this.writeToTerminal(screen.alternateScreen.out)

    // Stop resizing the screen
    if (this.trackScreenSize) {
      // this.style.assign({ width: undefined, height: undefined })
      // TODO: re add this ?
      // this.terminal.output.removeListener(`resize`, this.handleStdoutResize)
    }

    // Stop listening for events from the input stream
    this.subscription?.unsubscribe()
    this.subscription = null

    if (RECTANGULR_TARGET == 'node') {
      // Remove the exit hooks, since the screen is already closed
      process.removeListener(`uncaughtException`, (e) => this.handleException(e))
      process.removeListener(`exit`, () => this.handleExit())
    }

    this.trackScreenSize = false

    this.ready = false
  }

  clearScreen() {
    this.writeToTerminal(screen.clear)
  }

  exit() {
    this.releaseScreen()

    // @ts-ignore
    if (globalThis['RECTANGULR_TARGET'] == 'node') {
      process.exit(0)
    }
  }

  dispatchMouseOverEvents(e: any) {
    let targetElement = this.getElementAt(e.worldCoordinates)

    if (targetElement === this.mouseOverElement) return

    if (this.mouseOverElement) {
      let event = new Event(`mouseout`)
      event.mouse = e.mouse

      event.worldCoordinates = e.worldCoordinates
      event.contentCoordinates = e.contentCoordinates

      this.mouseOverElement.dispatchEvent(event)
    }

    this.mouseOverElement = targetElement

    if (this.mouseOverElement) {
      let event = new Event(`mouseover`)
      event.mouse = e.mouse

      event.worldCoordinates = e.worldCoordinates
      event.contentCoordinates = e.contentCoordinates

      this.mouseOverElement.dispatchEvent(event)
    }
  }

  dispatchMouseEnterEvents(e: any) {
    let targetElement = this.getElementAt(e.worldCoordinates)

    let index = this.mouseEnterElements.indexOf(targetElement)

    let removedElements = []
    let addedElements = []

    if (index !== -1) {
      removedElements = this.mouseEnterElements.splice(index + 1, this.mouseEnterElements.length)
    } else {
      let currentElement = targetElement
      let currentIndex = index

      while (currentElement && currentIndex === -1) {
        addedElements.unshift(currentElement)

        currentElement = currentElement.parentNode
        currentIndex = this.mouseEnterElements.indexOf(currentElement)
      }

      if (currentElement) {
        removedElements = this.mouseEnterElements.splice(
          currentIndex + 1,
          this.mouseEnterElements.length
        )
      } else {
        removedElements = this.mouseEnterElements.splice(0, this.mouseEnterElements.length)
      }
    }

    this.mouseEnterElements = this.mouseEnterElements.concat(addedElements)

    for (let t = removedElements.length - 1; t >= 0; --t) {
      let event = new Event(`mouseleave`, { bubbles: false })
      event.mouse = e.mouse

      event.worldCoordinates = e.worldCoordinates
      event.contentCoordinates = e.contentCoordinates

      removedElements[t].dispatchEvent(event)
    }

    for (let t = 0; t < addedElements.length; ++t) {
      let event = new Event(`mouseenter`, { bubbles: false })
      event.mouse = e.mouse

      event.worldCoordinates = e.worldCoordinates
      event.contentCoordinates = e.contentCoordinates

      addedElements[t].dispatchEvent(event)
    }
  }

  getElementAt(position) {
    this.triggerUpdates()

    let { x, y } = position

    for (let element of this.renderList) {
      if (!element.elementClipRect) continue

      if (
        x < element.elementClipRect.x ||
        x >= element.elementClipRect.x + element.elementClipRect.width
      )
        continue

      if (
        y < element.elementClipRect.y ||
        y >= element.elementClipRect.y + element.elementClipRect.height
      )
        continue

      return element
    }

    return null
  }

  renderScreen() {
    this.triggerUpdates()

    this.renderScreenImpl(this.flushDirtyRects())

    // // Recycle unused nodes after rendering
    // this.detachedNodes.forEach(node => {
    //   if (!node.parentNode) {
    //     this.recycleNode(node)
    //   }
    // })

    // setTimeout(() => {
    //   if (this.recycledThisTick > 0) {
    //     this.logger.log({ message: `recycleNode : recycled ${this.recycledThisTick} nodes` })
    //   }
    //   this.recycledThisTick = 0
    // })
    // this.detachedNodes.length = 0
  }

  poolNode(node: TermElement) {
    this.elementPool.pool(node)
  }

  queueDirtyRect(dirtyRect = this.elementClipRect, checkIntersectionFrom = 0) {
    if (Rect.isEmpty(dirtyRect)) return

    // Look if the dirtyRect intersects one that was already there
    let intersectorIndex = this.dirtyRects.findIndex(other => {
      return dirtyRect.intersectsRect(other)
    })

    // If it does, queue rects around the intersection
    if (intersectorIndex !== -1) {
      this.queueDirtyRects(
        dirtyRect.excludeRect(this.dirtyRects[intersectorIndex]),
        intersectorIndex + 1
      )
    } else {
      // assert(dirtyRect.x % 1 == 0)
      // assert(dirtyRect.y % 1 == 0)
      // assert(dirtyRect.width % 1 == 0)
      // assert(dirtyRect.height % 1 == 0)
      this.dirtyRects.push(dirtyRect)
    }

    this.requestUpdates()
  }

  renderScreenImpl(dirtyRects: Rect[] = [this.elementClipRect]) {
    const buffer = this.renderToString(dirtyRects)
    if (buffer.length > 0) {
      this.writeToTerminal(cursor.hidden + buffer)
    }
  }

  renderToString(dirtyRects: Rect[] = [this.elementClipRect]) {
    let buffer = ""

    let debugColor = DEBUG_COLORS[currentDebugColorIndex]
    currentDebugColorIndex = (currentDebugColorIndex + 1) % DEBUG_COLORS.length

    while (!isEmpty(dirtyRects)) {
      let dirtyRect = dirtyRects.shift()

      for (let element of this.renderList) {
        if (!element.elementClipRect) continue

        let intersection = Rect.getIntersectingRect(element.elementClipRect, dirtyRect)

        if (!intersection) continue

        let truncation = dirtyRect.excludeRect(intersection)
        dirtyRects = truncation.concat(dirtyRects)

        for (let y = 0, Y = intersection.height; y < Y; ++y) {
          let relativeX = intersection.x - element.elementWorldRect.x
          let relativeY = intersection.y - element.elementWorldRect.y + y

          let line = String(element.renderElement(relativeX, relativeY, intersection.width))

          if (this.debugPaintRects) line = style.color.back(debugColor) + line + style.clear

          buffer += cursor.moveTo({ x: intersection.x, y: intersection.y + y })
          buffer += line
        }

        break
      }
    }

    // if (this.activeElement?.caret) {
    //   let x =
    //     this.activeElement.contentWorldRect.x -
    //     this.activeElement.scrollRect.x +
    //     this.activeElement.caret.x
    //   let y =
    //     this.activeElement.contentWorldRect.y -
    //     this.activeElement.scrollRect.y +
    //     this.activeElement.caret.y
    //   buffer += cursor.moveTo({ x, y })
    //   buffer += cursor.normal
    // }

    if (this.activeElement && this.activeElement.contentClipRect && this.activeElement.caret) {
      let x =
        this.activeElement.contentWorldRect.x -
        this.activeElement.scrollRect.x +
        this.activeElement.caret.x
      let y =
        this.activeElement.contentWorldRect.y -
        this.activeElement.scrollRect.y +
        this.activeElement.caret.y

      // Is in the contentClipRect ?
      if (
        x >= this.activeElement.contentClipRect.x &&
        x < this.activeElement.contentClipRect.x + this.activeElement.contentClipRect.width &&
        y >= this.activeElement.contentClipRect.y &&
        y < this.activeElement.contentClipRect.y + this.activeElement.contentClipRect.height
      ) {
        let visibleElement = this.getElementAt(new Point({ x, y }))

        if (isInsideOf(this.activeElement, visibleElement)) {
          buffer += cursor.moveTo({ x, y })
          buffer += cursor.normal
        }
      }
    }

    return buffer
  }

  writeToTerminal(text: string) {
    if (this.ngZone) {
      this.ngZone.runOutsideAngular(() => {
        this.terminal.screen.write(text)
      })
    } else {
      this.terminal.screen.write(text)
    }
  }

  handleException(exception) {
    this.releaseScreen()

    process.stderr.write(exception.stack)
    process.exit(1)
  }

  handleExit() {
    this.parser.end()
    this.releaseScreen()
  }

  handleInput(input: Input) {
    assert(input.type)
    if (input.type == 'key') {
      KeyInputType.parse(input)
      let event = new Event(`keypress`, { cancelable: true, bubbles: true })
      event.key = input
      // this.logger.log({ input: keyToString(input) })

      this.dispatchEvent(event)
    } else if (input.type == 'mouse') {
      MouseInputType.parse(input)
      let worldCoordinates = new Point({ x: input.x, y: input.y })

      let targetElement = this.getElementAt(worldCoordinates)

      if (!targetElement) return // Some envs (xterm.js) sometimes send mouse coordinates outside of the possible range

      let contentCoordinates = new Point({
        x: worldCoordinates.x - targetElement.contentWorldRect.x,
        y: worldCoordinates.y - targetElement.contentWorldRect.y + targetElement.scrollTop,
      })

      if (input.name === `wheel`) {
        let event = new Event(`mousewheel`, { bubbles: true })
        event.mouse = input

        event.worldCoordinates = worldCoordinates
        event.contentCoordinates = contentCoordinates

        targetElement.dispatchEvent(event)
      } else {
        if (input.start) {
          let event = new Event(`mousedown`, { cancelable: true, bubbles: true })
          event.mouse = input

          event.worldCoordinates = worldCoordinates
          event.contentCoordinates = contentCoordinates

          targetElement.dispatchEvent(event)
        }

        if (input.end) {
          let event = new Event(`mouseup`, { cancelable: true, bubbles: true })
          event.mouse = input

          event.worldCoordinates = worldCoordinates
          event.contentCoordinates = contentCoordinates

          targetElement.dispatchEvent(event)
        }

        if (!input.start && !input.end) {
          let event = new Event(`mousemove`, { cancelable: true, bubbles: true })
          event.mouse = input

          event.worldCoordinates = worldCoordinates
          event.contentCoordinates = contentCoordinates

          targetElement.dispatchEvent(event)
        }
      }

    } else if (input.type == 'data') {
      // if (RECTANGULR_TARGET == 'web') {
      //   console.log(`target web cant handle data input: ${input.buffer}`)
      //   return
      // }

      DataInputType.parse(input)
      // let emitData = () => {
      //   let event = new Event(`data`, { cancelable: true })
      //   event.buffer = input

      //   if (this.activeElement) {
      //     this.activeElement.dispatchEvent(event)
      //   } else {
      //     this.dispatchEvent(event)
      //   }
      // }

      const asString = this.decoder.decode(input.buffer)
      for (const key of asString) {
        let event = new Event(`keypress`, { cancelable: true, bubbles: true })
        event.key = new Key(key)
        // log(`handleInput: ${keyToString(event.key)}`)

        // event.setDefault(() => {q
        //   emitData()
        // })

        this.dispatchEvent(event)
      }
    } else {
      throw new Error(`handleInput : Unknown input type ${input.type}`)
    }
    // forceRefresh()
  }

  private dirtyStyleNodes: TermElement[] = []

  queueDirtyStyle(element: TermElement): boolean {
    if (element.style.wasQueued) return false

    this.dirtyStyleNodes.push(element)
    element.style.wasQueued = true
    return true
  }

  computeStyles() {
    this.dirtyStyleNodes.sort((a, b) => a.depth - b.depth)
    for (const node of this.dirtyStyleNodes) {
      node.style.update()
    }
    this.dirtyStyleNodes.length = 0
  }

}

// We will iterate through those colors when rendering if the debugPaintRects option is set
const DEBUG_COLORS = [`red`, `green`, `blue`, `magenta`, `yellow`]
let currentDebugColorIndex = 0

type DataInput = {
  type: 'data',
  buffer: any
}

const DataInputType = z.object({
  type: z.literal('data')
})

type MouseInput = {
  type: 'mouse'
  name: string
  start: any
  end: any
  x: any
  y: any
}

const MouseInputType = z.object({
  type: z.literal('mouse'),
  name: z.string().nullable(),
  start: z.boolean(),
  end: z.boolean(),
  x: z.number(),
  y: z.number(),
})

type KeyInput = {
  type: 'key'
  name: string,
  alt: boolean
  ctrl: boolean
  meta: boolean
  shift: boolean
}

const KeyInputType = z.object({
  type: z.literal('key'),
  name: z.string(),
  alt: z.boolean(),
  ctrl: z.boolean(),
  meta: z.boolean(),
  shift: z.boolean(),
})

type RawInput = {
  type: 'raw',
  buffer: Uint8Array
}

const RawInputType = z.object({
  type: z.literal('raw')
})

export type Input = KeyInput | MouseInput | DataInput | RawInput

function handleInputFromTermStrings(data: Production): void {

}

