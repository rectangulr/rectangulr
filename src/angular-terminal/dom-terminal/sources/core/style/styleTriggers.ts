import * as _ from '@s-libs/micro-dash'
import * as Yoga from 'typeflex'
import { Element } from '../dom/Element'
import { TermElement } from '../../term'

export function dirtyLayout(node: Element) {
  node.setDirtyLayoutFlag()
}

export function dirtyClipping(node: Element) {
  node.setDirtyClippingFlag()
}

export function dirtyRendering(node: Element) {
  node.queueDirtyRect()
}

// export function dirtyFocusList(node: Element) {
//   node.rootNode.setDirtyFocusListFlag()
// }

export function dirtyRenderList(node: Element) {
  node.rootNode.setDirtyRenderListFlag()
}

export function onNullSwitch(trigger) {
  return function (node, newValue, oldValue) {
    if ((newValue === null) === (oldValue === null)) return

    trigger(node, newValue, oldValue)
  }
}

export function forwardToYoga(fnName, ...args) {
  if (!Yoga.Node.prototype[fnName]) throw new Error(`Invalid Yoga method "${fnName}"`)

  return function (node: TermElement, newValue) {
    const newArgs = args.map(arg => {
      if (typeof arg === `function`) {
        return arg(newValue)
      } else {
        return arg
      }
    })
    node.yogaNode[fnName](
      ...newArgs
    )
  }
}

function printParentChain(el: TermElement, res = "") {
  if (el.parentNode) {
    printParentChain(el.parentNode, res)
  }
  res += `${el.id} -> `
  return res
}

forwardToYoga.value = function (value) {
  if (value != null) {
    return value.toYoga()
  } else {
    return value
  }
}

export function forwardToTextLayout(optName, cb) {
  return function (node, newValue) {
    if (!node.conf) return

    node.setLayoutConfig({ [optName]: cb(newValue) })
  }
}
