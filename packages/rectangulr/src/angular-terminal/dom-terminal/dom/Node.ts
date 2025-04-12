import * as _ from '@s-libs/micro-dash'
import { assert } from '../../../utils/Assert'
import { Event } from './Event'
import { TermScreen } from './TermScreen'

let currentNodeId = 0

export class Node<T extends Node<T>> {

  id = currentNodeId++
  depth = 9999
  rootNode: TermScreen | undefined = undefined
  parentNode: T | undefined = undefined
  previousSibling: T = undefined
  nextSibling: T = undefined
  childNodes: T[] = []

  reset() {
    this.rootNode = null
    this.parentNode = null

    this.previousSibling = null
    this.nextSibling = null

    this.childNodes = []
  }

  eventListeners: { [name: string]: Function[] } = {}

  addEventListener(name: string, func: (e: Event) => void, options?: { bubbles: true }) {
    if (!this.eventListeners[name]) {
      this.eventListeners[name] = [func]
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

    if (event.bubbles && this.parentNode) {
      this.parentNode.dispatchEvent(event)
    }
  }

  appendTo(node: T) {
    if (!(node instanceof Node))
      throw new Error(`Failed to execute 'appendTo': Parameter 1 is not of type 'Node'.`)

    // if (!Reflect.getOwnPropertyDescriptor(this, `parentNode`).writable)
    //   throw new Error(
    //     `Failed to execute 'appendTo': The new child element doesn't allow being appended to another node.`
    //   )

    if (wouldContainItself(this, node))
      throw new Error(`Failed to execute 'appendTo': The new child element contains the parent.`)

    this.remove()

    node.appendChild(this as unknown as T)
  }

  appendChild(node: T) {
    if (!(node instanceof Node))
      throw new Error(`Failed to execute 'appendChild': Parameter 1 is not of type 'Node'.`)

    // if (!Reflect.getOwnPropertyDescriptor(node, `parentNode`).writable)
    //   throw new Error(
    //     `Failed to execute 'appendChild': The new child element doesn't allow being appended to another node.`
    //   )

    if (wouldContainItself(node, this))
      throw new Error(`Failed to execute 'appendChild': The new child element contains the parent.`)

    node.remove()

    this.linkBefore(node, null)
  }

  insertBefore(node: T, referenceNode: T) {
    if (!(node instanceof Node))
      throw new Error(`Failed to execute 'insertBefore': Parameter 1 is not of type 'Node'.`)

    if (!(referenceNode instanceof Node) && referenceNode !== null)
      throw new Error(`Failed to execute 'insertBefore': Parameter 2 is not of type 'Node'.`)

    // if (!Reflect.getOwnPropertyDescriptor(node, `parentNode`).writable)
    //   throw new Error(
    //     `Failed to execute 'insertBefore': The new child element doesn't allow being appended to another node.`
    //   )

    if (wouldContainItself(node, this))
      throw new Error(
        `Failed to execute 'insertBefore': The new child element contains the parent.`
      )

    if (referenceNode && referenceNode.parentNode !== (this as unknown as T))
      throw new Error(
        `Failed to execute 'insertBefore': The node before which the new node is to be inserted is not a child of this node.`
      )

    node.remove()

    this.linkBefore(node, referenceNode)
  }

  linkBefore(node: T, referenceNode) {
    let index = referenceNode ? this.childNodes.indexOf(referenceNode) : this.childNodes.length

    if (node.parentNode) node.remove()

    node.parentNode = (this as unknown as T)
    node.depth = this.depth + 1

    this.childNodes.splice(index, 0, node)

    node.traverse(traversedNode => {
      traversedNode.rootNode = this.rootNode
      assert(traversedNode.parentNode)
      traversedNode.depth = traversedNode.parentNode.depth + 1
    })
  }

  removeChild(node) {
    if (!(node instanceof Node)) {
      throw new Error(`Failed to execute 'removeChild': Parameter 1 is not of type 'Node'.`)
    }

    if (node.parentNode !== this as any) {
      throw new Error(`Failed to execute 'removeChild': The node to be removed is not a child of this node.`)
    }

    node.parentNode = null

    if (node.previousSibling) node.previousSibling.nextSibling = node.nextSibling

    if (node.nextSibling) node.nextSibling.previousSibling = node.previousSibling

    node.previousSibling = null
    node.nextSibling = null

    let index = this.childNodes.indexOf(node as unknown as T)
    this.childNodes.splice(index, 1)

    node.traverse(traversedNode => {
      if (node === null) debugger
      // @ts-ignore
      // traversedNode.rootNode = node
      traversedNode.rootNode = null
    })
  }

  remove() {
    if (!this.parentNode) return

    this.parentNode.removeChild(this)
  }

  setPropertyAccessor(name, { validate = val => true, get = null, set = null }) {
    Reflect.defineProperty(this, name, {
      get() {
        return get()
      },

      set(newValue) {
        if (!validate(newValue))
          throw new Error(
            `Failed to set "${name}": The value to be set does not pass the property's validation routine.`
          )

        return set(newValue)
      },
    })
  }

  setPropertyTrigger(name, initial, { validate = val => true, trigger = val => { } }) {
    let value

    Reflect.defineProperty(this, name, {
      get() {
        return value
      },

      set(newValue) {
        if (newValue === value) return

        if (!validate(newValue))
          throw new Error(
            `Failed to set "${name}": The value to be set does not pass the property's validation routine.`
          )

        value = newValue
        trigger(newValue)
      },
    })

    this[name] = initial
  }

  traverse = (fn: (el: T, depth) => void, { depth = Infinity, currentDepth = 0 } = {}) => traverse(this, fn)

  inspect() {
    return this.toString()
  }
}

export function traverse<T extends Node<T>>(node: Node<T>, fn: (el: T, depth) => void, { depth = Infinity, currentDepth = 0 } = {}) {
  if (currentDepth >= depth) return

  fn(node as unknown as T, currentDepth)

  for (let child of node.childNodes) {
    child.traverse(fn, { depth, currentDepth: currentDepth + 1 })
  }
}

function wouldContainItself(node, parentNode) {
  if (node === parentNode) return true

  return node.childNodes.some(child => {
    return wouldContainItself(child, parentNode)
  })
}

export function isInsideOf<T extends Node<T>>(parent: T, child: T) {
  let current = child
  while (current != null) {
    if (current == parent) {
      return true
    } else {
      current = current.parentNode
    }
  }
  return false
}

export function traverseChildrenFirst<T extends Node<T>>(node: T, func: (parent: T, child: T) => void) {
  for (const child of node.childNodes) {
    traverseChildrenFirst(child, func)
    func(node, child)
  }
}