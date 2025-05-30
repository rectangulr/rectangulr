import { Injectable, Renderer2, RendererFactory2, RendererStyleFlags2, RendererType2, inject } from '@angular/core'
import * as _ from '@s-libs/micro-dash'
import json5 from 'json5'
import { addToGlobalRg } from '../utils/addToGlobalRg'
import { mergeDeep } from '../utils/mergeDeep'
import { assertDebug } from '../utils/utils'
import { ElementPool, TermElement, TermScreen } from './dom-terminal'
import { LOGGER } from './logger'
import { ScreenService } from './ScreenService'
import { assert } from '../utils/Assert'

@Injectable({
  providedIn: 'root'
})
export class RectangulrRendererFactory2 implements RendererFactory2 {
  private screen = inject(ScreenService)
  protected renderer = inject(RectangulrRenderer2)

  end() {
    if (this.screen.termScreen.terminal.screen) {
      assert(this.screen.termScreen.frame.size.width != 0)
      this.screen.selectRootElement().renderToTerminal('full')
    }
  }

  createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
    return this.renderer
  }
}

@Injectable({
  providedIn: 'root'
})
export class RectangulrRenderer2 implements Renderer2 {
  screenService = inject(ScreenService)
  elementPool = inject(ElementPool)

  readonly data: { [p: string]: any }
  logger = inject(LOGGER)

  destroy(): void { }

  selectRootElement(): TermScreen {
    return this.screenService.selectRootElement()
  }

  createElement(name: string, namespace?: string | null): TermElement {
    const element = this.elementPool.create(name)
    element.name = name
    // this.logger.log({ message: 'createElement', id: element.id })
    return element
  }

  createComment(value: string): any {
    const comment = this.createElement('text')
    comment.style.add({ display: 'none' })
    comment.name = 'comment'
    // this.logger.log({ message: 'createComment', id: comment.id })
    return comment
  }

  createText(value: string): any {
    const element = this.createElement('text') as any
    element.textContent = value
    // this.logger.log({ message: 'createText', id: element.id })
    return element
  }

  appendChild(parent: TermElement, newChild: TermElement): void {
    // this.logger.log({ message: 'appendChild', parent: parent.id, newChild: newChild.id })
    parent.appendChild(newChild)
  }

  insertBefore(parent: TermElement, newChild: TermElement, refChild: TermElement): void {
    // this.logger.log({ message: 'insertBefore', parent: parent.id, newChild: newChild.id, refChild: refChild.id })
    parent.insertBefore(newChild, refChild)
  }

  removeChild(renderer: any, rNode: TermElement, isHostElement?: boolean): void {
    // this.logger.log({ message: 'removeChild', parent: parent.id, oldChild: oldChild.id })
    const parent = rNode.parentNode
    assertDebug(parent)
    parent.removeChild(rNode)
  }

  destroyNode(node: TermElement) {
    // Destroy children first
    for (const child of node.childNodes) {
      this.removeChild(node, child,)
      this.destroyNode(child)
    }
    this.selectRootElement().poolNode(node)
  }

  listen(
    target: TermElement,
    eventName: string,
    callback: (event: any) => boolean | void
  ): () => void {
    target.addEventListener(eventName, callback)
    return () => { target.removeEventListener(eventName, callback) }
  }

  parentNode(node: TermElement): any {
    return node.parentNode
  }

  nextSibling(node: TermElement): any {
    return node.nextSibling
  }

  setValue(node: TermElement, value: string): void {
    // log(`setValue: ${serializeDOMNode(node)} -> "${value}"`);
    //@ts-ignore
    node.textContent = value
  }

  setAttribute(el: TermElement, name: string, value: string, namespace?: string | null): void {
    el[name] = value
  }

  removeAttribute(el: any, name: string, namespace?: string | null): void {
    el[name] = null
  }

  setProperty(el: TermElement, name: string, value: any): void {
    // if (name == 'classes') {
    //   const enabledClasses = value
    //     .map(item => {
    //       if (Array.isArray(item)) {
    //         return item[1] ? item[0] : null
    //       } else {
    //         return item
    //       }
    //     })
    //     .filter(t => t)

    //   el.classList.assign(enabledClasses)
    // } else {
    //   el[name] = value
    // }
  }

  setStyle(el: TermElement, style: string, value: any, flags?: RendererStyleFlags2): void {
    // el.style[style] = value
  }

  removeStyle(el: TermElement, style: string, flags?: RendererStyleFlags2): void {
    // el.style[style] = null
  }

  addClass(el: TermElement, className: string): void {
    // el.classList.add(className)
  }

  removeClass(el: TermElement, className: string): void {
    // el.classList.remove(className)
  }
}

interface StringifyOptions {
  parent?: boolean
  children?: boolean
}

function stringifyDomNode(node, options?: StringifyOptions) {
  options = { parent: false, children: true, ...options }
  const cache = new WeakSet()

  function _stringifyDomNode(node, cache, options: StringifyOptions) {
    let res: any = {}

    if (node.nodeName == 'TermText2' || node.nodeName == 'TermComment') {
      res.text = node.textContent
    }

    res.infos = {}
    res.infos = mergeDeep(
      res.infos,
      {
        flexGrow: node.style.get('flexGrow'),
        flexShrink: node.style.get('flexShrink'),
        height: node.style.get('height'),
        width: node.style.get('width'),
      }
    )
    res.infos = mergeDeep(res.infos, _.pick(node, 'elementRect', 'elementWorldRect', 'elementClipRect'))
    res.ref = node
    res.name = node.name

    // Prevent infinite loop
    if (!cache.has(node)) {
      cache.add(node)

      if (options.children && node.childNodes.length > 0) {
        res.children = node.childNodes
          .map(n => {
            return _stringifyDomNode(n, cache, options)
          })
          .filter(n => n.name != 'comment')
      }
      if (options.parent && node.parentNode) {
        res.parent = _stringifyDomNode(node.parentNode, cache, options)
      }
    }

    res.toString = () => {
      return node.name + ' #' + node.id + '  ' + json5.stringify(res.infos)
    }

    return res
  }

  return _stringifyDomNode(node, cache, options)
}

function globalDebugDOM(node, options?: StringifyOptions) {
  if (node) {
    return stringifyDomNode(node, options)
  } else {
    const rootNode = globalThis['DOM']
    return stringifyDomNode(rootNode, options)
  }
}

function globalDebugDOMSearch(condition: string | Function, options?: StringifyOptions) {
  const rootNode = globalThis['DOM']
  let result = []
  function searchRecursive(node, condition, result) {
    if (typeof condition == 'string') {
      if (node.textContent?.includes(condition)) {
        result.push(node)
      }
    } else {
      if (condition(node)) {
        result.push(node)
      }
    }
    for (const child of [...node.childNodes]) {
      searchRecursive(child, condition, result)
    }
  }
  searchRecursive(rootNode, condition, result)
  return result.map(node => stringifyDomNode(node, { parent: true, ...options }))
}

function globalDebugDOMSize(text) {
  const rootNode = globalThis['DOM']
  let result = []
  function searchRecursive(node, text, result) {
    if (
      node.elementRect.width != node.scrollRect.width ||
      node.elementRect.height != node.scrollRect.height
    ) {
      result.push(node)
    }
    for (const child of [...node.childNodes]) {
      searchRecursive(child, text, result)
    }
  }
  searchRecursive(rootNode, text, result)
  return result.map(node => stringifyDomNode(node, { parent: true }))
}

addToGlobalRg({
  dom: globalDebugDOM,
  domSearch: globalDebugDOMSearch,
})
