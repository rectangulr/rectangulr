import * as Yoga from 'typeflex'
import { TermElement } from '../../core/dom/Element'
import { TermText2 } from '../../term'

export function dirtyLayout(node: TermElement) {
  node.setDirtyLayoutFlag()
}

export function dirtyClipping(node: TermElement) {
  node.setDirtyClippingFlag()
}

export function dirtyRendering(node: TermElement) {
  node.queueDirtyRect()
}

// export function dirtyFocusList(node: Element) {
//   node.rootNode.setDirtyFocusListFlag()
// }

export function dirtyRenderList(node: TermElement) {
  node.rootNode?.setDirtyRenderListFlag()
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
  return function (node: TermText2, newValue) {
    if (!node.conf) return

    node.setLayoutConfig({ [optName]: cb(newValue) })
  }
}
