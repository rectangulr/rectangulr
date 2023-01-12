import {
  Injectable,
  Renderer2,
  RendererFactory2,
  RendererStyleFlags2,
  RendererType2,
} from '@angular/core'
import * as json5 from 'json5'
import _ from 'lodash'
import { addToGlobalRg, mergeDeep } from '../utils/utils'
import { TermElement, TermScreen } from './dom-terminal'
import { ScreenService } from './screen-service'

@Injectable({ providedIn: 'root' })
export class RectangulrRendererFactory implements RendererFactory2 {
  protected renderer: Renderer2

  constructor(private screen: ScreenService) {
    this.renderer = new TerminalRenderer(screen)
  }

  end() {
    // if (this.screen.screen.stdout) {
    this.screen.selectRootElement().renderScreen()
    // }
  }

  createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
    return this.renderer
  }
}

export class TerminalRenderer implements Renderer2 {
  readonly data: { [p: string]: any }
  destroyNode = null

  constructor(private screen: ScreenService) {}

  destroy(): void {}

  selectRootElement(): TermScreen {
    return this.screen.selectRootElement()
  }

  createElement(name: string, namespace?: string | null): any {
    return this.screen.createElement(name)
  }

  createComment(value: string): any {
    const comment = this.screen.createElement('text')
    comment.style.display = 'none'
    comment.nodeName = 'TermComment'
    return comment
  }

  createText(value: string): any {
    const element = this.screen.createElement('text') as any
    element.textContent = value
    return element
  }

  appendChild(parent: TermElement, newChild: TermElement): void {
    // log(`appendChild: ${serializeDOMNode(parent)} -> ${serializeDOMNode(newChild)}`);
    parent.appendChild(newChild)
  }

  insertBefore(parent: TermElement, newChild: any, refChild: any): void {
    // log(`insertBefore: ${serializeDOMNode(parent)} -> ${serializeDOMNode(newChild)},${serializeDOMNode(refChild)}`);
    parent.insertBefore(newChild, refChild)
  }

  removeChild(parent: TermElement, oldChild: any): void {
    // log(`removeChild: ${serializeDOMNode(parent)} -> ${JSON.stringify(simplifyViewTree(oldChild), null, 2)}`);
    parent.removeChild(oldChild)
  }

  listen(
    target: TermElement,
    eventName: string,
    callback: (event: any) => boolean | void
  ): () => void {
    // target.addEventListener(eventName, callback)
    // return () => { target.removeListener(eventName, callback) }
    return () => {}
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
    if (name == 'classes') {
      const enabledClasses = value
        .map(item => {
          if (Array.isArray(item)) {
            return item[1] ? item[0] : null
          } else {
            return item
          }
        })
        .filter(t => t)

      el.classList.assign(enabledClasses)
    } else {
      el[name] = value
    }
  }

  setStyle(el: TermElement, style: string, value: any, flags?: RendererStyleFlags2): void {
    el.style[style] = value
  }

  removeStyle(el: TermElement, style: string, flags?: RendererStyleFlags2): void {
    el.style[style] = null
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
      _.mapValues(
        _.pick(node.style.$, ['flexGrow', 'flexShrink', 'height', 'width']),
        i => i.serialize?.() ?? i
      )
    )
    res.infos = mergeDeep(res.infos, _.pick(node, ['elementRect', 'scrollRect']))
    res.ref = node

    // Prevent infinite loop
    if (!cache.has(node)) {
      cache.add(node)

      if (options.children && node.childNodes.length > 0) {
        res.children = node.childNodes.map(n => {
          return _stringifyDomNode(n, cache, options)
        })
      }
      if (options.parent && node.parentNode) {
        res.parent = _stringifyDomNode(node.parentNode, cache, options)
      }
    }

    res.toString = () => {
      return node.nodeName + ' #' + node.id + '  ' + json5.stringify(res.infos)
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
    if (node.nodeName == 'TermText2') {
      if (typeof condition == 'string') {
        if (node.textContent.includes(condition)) {
          result.push(node)
        }
      } else {
        if (condition(node)) {
          result.push(node)
        }
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
