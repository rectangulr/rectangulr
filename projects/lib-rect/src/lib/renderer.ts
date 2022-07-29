import {
  Injectable,
  Renderer2,
  RendererFactory2,
  RendererStyleFlags2,
  RendererType2,
} from '@angular/core'
import fs from 'fs'
import json5 from 'json5'
import _ from 'lodash'
import { TermElement, TermScreen } from '../mylittledom'
import { Screen } from './screen-service'

@Injectable({ providedIn: 'root' })
export class TerminalRendererFactory implements RendererFactory2 {
  protected renderer: Renderer2

  constructor(private screen: Screen) {
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

  constructor(private screen: Screen) {}

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
    // log(`appendChild: ${serializeViewNode(parent)} -> ${serializeViewNode(newChild)}`);
    parent.appendChild(newChild)
  }

  insertBefore(parent: TermElement, newChild: any, refChild: any): void {
    // log(`insertBefore: ${serializeViewNode(parent)} -> ${serializeViewNode(newChild)},${serializeViewNode(refChild)}`);
    parent.insertBefore(newChild, refChild)
  }

  removeChild(parent: TermElement, oldChild: any): void {
    // log(`removeChild: ${serializeViewNode(parent)} -> ${JSON.stringify(simplifyViewTree(oldChild), null, 2)}`);
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
    // log(`setValue: ${serializeViewNode(node)} -> "${value}"`);
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

function log(message) {
  fs.writeFile('./log.txt', message + '\n', { flag: 'a+' }, err => {})
}

function serializeViewNode(node) {
  return `#${node.id}`
}

function simplifyViewTree(node) {
  const cache = new Set()

  function _simplifyViewTree(node, cache) {
    let res: any = {
      name: node.nodeName + ' #' + node.id,
    }

    if (node.nodeName == 'TermText2') {
      res.text = node.textContent
    }

    res.style = _.mapValues(_.pick(node, ['scrollRect', 'elementRect']), i => i)
    res.style.scrollTop = node.scrollTop

    // Prevent infinite loop
    if (!cache.has(node)) {
      cache.add(node)

      if (node.childNodes.length > 0) {
        res.children = node.childNodes.map(n => {
          return _simplifyViewTree(n, cache)
        })
      }
    }

    return res
  }

  return _simplifyViewTree(node, cache)
}

function showSize(element) {
  if (element == null) return null

  const extract = _.pick(element, ['y', 'height'])
  return json5.stringify(extract)
}

function serializeViewTree(node, depth = 0) {
  let serializedSubTree = ''
  if (node.childNodes) {
    serializedSubTree = node.childNodes.map(n => serializeViewTree(n, depth + 1)).join('')
  }

  let serialized = `${node.nodeName}#${node.id} ${node.textContent ? ': ' + node.textContent : ''}`
  serialized += ' ' + showSize(node?.elementRect)
  serialized += ' ' + showSize(node?.elementClipRect)

  return `${' '.repeat(depth * 4)}${serialized}\n${serializedSubTree}`
}

globalThis['inspectViewTree'] = simplifyViewTree
globalThis['serializeViewTree'] = serializeViewTree
