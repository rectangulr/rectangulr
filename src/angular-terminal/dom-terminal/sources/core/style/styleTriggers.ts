import _ from 'lodash'
import * as Yoga from 'yoga-layout-prebuilt'

export function dirtyLayout(node) {
  node.setDirtyLayoutFlag()
}

export function dirtyClipping(node) {
  node.setDirtyClippingFlag()
}

export function dirtyRendering(node) {
  node.queueDirtyRect()
}

export function dirtyFocusList(node) {
  node.rootNode.setDirtyFocusListFlag()
}

export function dirtyRenderList(node) {
  node.rootNode.setDirtyRenderListFlag()
}

export function onNullSwitch(trigger) {
  return function (node, newValue, oldValue) {
    if (_.isNull(newValue) === _.isNull(oldValue)) return

    trigger(node, newValue, oldValue)
  }
}

export function forwardToYoga(fnName, ...args) {
  // @ts-ignore
  if (!Yoga.Node.prototype[fnName]) throw new Error(`Invalid Yoga method "${fnName}"`)

  return function (node, newValue) {
    node.yogaNode[fnName](
      ...args.map(arg => {
        if (typeof arg === `function`) {
          return arg(newValue)
        } else {
          return arg
        }
      })
    )
  }
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
    if (!node.textLayout) return

    node.textLayout.setConfiguration({ [optName]: cb(newValue) })
  }
}
