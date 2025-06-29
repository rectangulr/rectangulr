import { inject, Injectable, NgZone, signal } from '@angular/core'
import { LogPointService } from '../../../logs/LogPointService'
import { Tasks } from '../../../tasks/Tasks'
import { cursor, feature, screen, style } from '../../../term-strings/core'
import { Key } from '../../../term-strings/parse'
import { Parser } from '../../../term-strings/parse/parser/Parser'
import { sequences } from '../../../term-strings/parse/sequences'
import { assert } from '../../../utils/Assert'
import { Disposable } from '../../../utils/queue'
import { TERMINAL, Terminal } from '../../terminals/Terminal'
import { AnsiCode, ansiCodesToString } from '../paint/AnsiCodes'
import { Frame } from '../paint/Frame'
import { ElementPool } from './element-pool'
import { Event } from './Event'
import { DataInputType, Input, KeyInputType, MouseInputType, RawInputType } from './InputTypes'
import { Point } from './Point'
import { TermContainer } from './TermContainer'
import { TermElement } from './TermElement'

@Injectable({
  providedIn: 'root'
})
export class TermScreen extends TermContainer {
  lp: LogPointService = inject(LogPointService)
  elementPool = inject(ElementPool)
  ngZone = inject(NgZone)
  tasks = inject(Tasks)
  terminal = inject(TERMINAL)

  mouseOverElement: TermElement | null = null
  mouseEnterElements: TermElement[] = []
  caret: Point = null as any
  // detachedNodes: Element[] = []
  parser: Parser
  decoder = new TextDecoder()
  size = signal({ width: 0, height: 0 })

  frame?: Frame

  dirtyStyleSet = new Set<TermElement>()
  dirtyLayoutSet = new Set<TermElement>()
  dirtyClipSet = new Set<TermElement>()
  dirtyRenderSet = new Set<TermElement>()

  // recycledThisTick = 0

  constructor() {
    super()
    this.rootNode = this
    this.depth = 0

    this.style.add({
      position: 'relative',
      scroll: null,
      flexShrink: 0,
      flexGrow: 0,
    })
    this.style.add(this.size)

    this.attachTerminal(this.terminal)
    this.frame = new Frame(this.size())
    assert(this.lp)
    this.frame.lp = this.lp

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
  }

  terminalInputSubscription?: Disposable = undefined

  attachTerminal(terminal: Terminal) {
    this.terminal = terminal

    // Listen to terminal keyboard/mouse inputs, resize event
    {
      this.terminalInputSubscription = this.terminal.inputs.subscribe(input => {
        if (input.type == 'raw') {
          RawInputType.parse(input)
          this.parser.feed(input.buffer)
        } else {
          this.handleInput(input)
        }
      })

      // Automatically resize the screen when its output changes
      this.size.set(this.terminal.screen.size())
      this.terminal.screen.on('resize', size => {
        this.size.set(this.terminal.screen.size())
        this.frame.setSize(this.size())
      })
    }

    // Setup terminal
    {
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
    }

    // Finally schedule the first render of the screen
    // this.renderToTerminal('full')
  }

  detachTerminal() {
    // Disable the various mouse tracking modes
    this.writeToTerminal(feature.enableExtendedCoordinates.out)
    this.writeToTerminal(feature.enableMouseMoveTracking.out)
    this.writeToTerminal(feature.enableMouseHoldTracking.out)

    // Display the cursor back
    this.writeToTerminal(cursor.normal)

    // Exit the alternate screen
    this.writeToTerminal(screen.alternateScreen.out)

    // Stop listening for events from the input stream
    this.terminalInputSubscription.dispose()
    this.terminalInputSubscription = null
  }

  clearScreen() {
    this.writeToTerminal(screen.clear)
  }

  dispatchMouseOverEvents(e: any) {
    let targetElement = this.getElementAt(e.worldCoordinates)

    if (targetElement === this.mouseOverElement) return

    if (this.mouseOverElement) {
      let event = new Event('mouseout')
      event.mouse = e.mouse

      event.worldCoordinates = e.worldCoordinates
      event.contentCoordinates = e.contentCoordinates

      this.mouseOverElement.dispatchEvent(event)
    }

    this.mouseOverElement = targetElement

    if (this.mouseOverElement) {
      let event = new Event('mouseover')
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

    for (const element of addedElements) {
      let event = new Event(`mouseenter`, { bubbles: false })
      event.mouse = e.mouse

      event.worldCoordinates = e.worldCoordinates
      event.contentCoordinates = e.contentCoordinates

      element.dispatchEvent(event)
    }
  }

  getElementAt(position) {
    this.updateDirtyNodes()

    return getElementAt(this.rootNode, position)
  }

  requestRender() {
    this.tasks.queueOnce({
      func: () => { this.renderToAnsiCodes('full') },
      debounce: Tasks.UI,
      name: 'rg.renderScreen',
    })
  }

  updateDirtyNodes() {
    this.updateDirtyStyle()
    this.updateDirtyLayout()
    this.updateDirtyClip()
  }

  updateDirtyStyle() {
    const list = Array.from(this.dirtyStyleSet)
    // assertDebug(list.length > 0)
    list.sort((a, b) => a.depth - b.depth)
    for (let node of list) {
      if (node.dirtyStyle) {
        node.updateStyle()
        node.dirtyStyleQueued = false
      }
    }
    this.dirtyStyleSet.clear()
  }

  updateDirtyLayout() {
    const list = Array.from(this.dirtyLayoutSet)
    // assertDebug(list.length > 0)
    list.sort((a, b) => a.depth - b.depth)
    this.rootNode.yogaNode.calculateLayout()
    for (let node of list) {
      if (node.dirtyLayout) {
        node.updateLayout()
        node.dirtyLayoutQueued = false
      }
    }
    this.dirtyLayoutSet.clear()
  }

  updateDirtyClip() {
    const list = Array.from(this.dirtyClipSet)
    // assertDebug(list.length > 0)
    list.sort((a, b) => a.depth - b.depth)
    for (let node of list) {
      if (node.dirtyClip) {
        node.updateClip()
        node.dirtyClipQueued = false
      }
    }
    this.dirtyClipSet.clear()
  }

  renderToAnsiCodes(renderMode: 'diff' | 'full'): AnsiCode[] {
    this.updateDirtyNodes()

    let renderList: TermElement[]
    if (renderMode == 'diff') {
      renderList = Array.from(this.dirtyRenderSet)
      renderList.sort((a, b) => a.depth - b.depth)
    } else {
      renderList = [this]
    }

    for (const el of renderList) {
      el.render(renderMode, this.frame)
    }

    let ansiCodes = this.frame.renderAnsiCodes(renderMode)
    this.dirtyRenderSet.clear()

    return ansiCodes

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

  renderToString(renderMode: 'diff' | 'full' = 'diff') {
    this.updateDirtyNodes()
    const codes = this.renderToAnsiCodes(renderMode)
    return ansiCodesToString(codes)
  }

  renderToTerminal(renderMode: 'diff' | 'full' = 'diff') {
    const buffer = this.renderToString(renderMode)
    if (buffer.length > 0) {
      this.writeToTerminal(cursor.hidden + style.clear + buffer)
    }
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

  poolNode(node: TermElement) {
    this.elementPool.pool(node)
  }

  handleExit() {
    this.parser.end()
    this.detachTerminal()
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

      if (!targetElement) {
        // Some envs (xterm.js) sometimes send mouse coordinates outside of the possible range
        debugger
        return
      }

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
}

/**
 * Recursively retrieves the terminal element located at a specific position within a given node.
 *
 * @param node - The root terminal element to search within.
 * @param position - The point (x, y) to locate within the terminal element hierarchy.
 * @returns The terminal element at the specified position, or `null` if no element is found.
 */
function getElementAt(node: TermElement, position: Point): TermElement | null {
  for (const c of node.childNodes) {
    if (c.elementClipRect.includesPoint(position)) {
      const res = getElementAt(c, position)
      if (res) {
        return res
      } else {
        return node
      }
    }
  }

  if (node.elementClipRect.includesPoint(position)) {
    return node
  } else {
    return null
  }
}

// We will iterate through those colors when rendering if the debugPaintRects option is set
const DEBUG_COLORS = [`red`, `green`, `blue`, `magenta`, `yellow`]
let currentDebugColorIndex = 0
