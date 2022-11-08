import _ from 'lodash'

export class Event {
  mouse: any
  worldCoordinates: any
  contentCoordinates: any
  name: any
  bubbles: boolean
  cancelable: boolean
  immediatlyCanceled: boolean
  propagationStopped: boolean
  defaultPrevented: boolean
  default: any
  target: any
  currentTarget: any
  bubblingCanceled: boolean
  states: any
  properties: Set<unknown>
  key: any
  buffer: Buffer

  constructor(name, { bubbles = false, cancelable = false } = {}, attrs = {}) {
    this.name = name

    this.bubbles = bubbles
    this.cancelable = cancelable

    this.immediatlyCanceled = false
    this.propagationStopped = false

    this.defaultPrevented = false
    this.default = null

    this.target = null
    this.currentTarget = null

    for (let [key, value] of Object.entries(attrs)) {
      this[key] = value
    }
  }

  reset() {
    this.immediatlyCanceled = false
    this.bubblingCanceled = false

    this.defaultPrevented = false
    this.default = null

    this.target = null
    this.currentTarget = null

    return this
  }

  stopImmediatePropagation() {
    this.immediatlyCanceled = true
    this.propagationStopped = true
  }

  stopPropagation() {
    this.propagationStopped = true
  }

  preventDefault() {
    if (!this.cancelable)
      throw new Error(`Failed to execute 'preventDefault': Event is not cancelable.`)

    this.defaultPrevented = true
  }

  setDefault(callback) {
    if (!_.isFunction(callback))
      throw new Error(
        `Failed to execute 'setDefaultAction': Parameter 1 is not of type 'function'.`
      )

    this.default = callback
  }

  inspect() {
    let defaultPrevented = this.defaultPrevented ? ` (default prevented)` : ``

    return `<Event ${this.name}${defaultPrevented}>`
  }
}
