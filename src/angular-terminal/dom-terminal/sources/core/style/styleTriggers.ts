import _ from 'lodash'
import * as Yoga from 'yoga-layout-prebuilt'
import { Element } from '../dom/Element'

export function dirtyLayout(node: Element) {
  node.setDirtyLayoutFlag()
}

export function dirtyClipping(node: Element) {
  node.setDirtyClippingFlag()
}

export function dirtyRendering(node: Element) {
  node.queueDirtyRect()
}

export function dirtyFocusList(node: Element) {
  node.rootNode.setDirtyFocusListFlag()
}

export function dirtyRenderList(node: Element) {
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
    if (!node.conf) return

    node.setLayoutConfig({ [optName]: cb(newValue) })
  }
}
