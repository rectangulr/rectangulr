import { TermElement } from '../dom/TermElement'
import { TermText } from '../dom/TermText'
import { Yoga } from '../layout/typeflex'

export function dirtyLayout(node: TermElement) {
  node.dirtyLayout = true
  node.queueDirtyLayout()
}

export function dirtyClip(node: TermElement) {
  node.dirtyClip = true
  node.queueDirtyClip()
}

export function dirtyRendering(node: TermElement) {
  node.dirtyRender = true
  node.queueDirtyRender()
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
  return function (node: TermText, newValue) {
    if (!node.conf) return

    node.setLayoutConfig({ [optName]: cb(newValue) })
  }
}
