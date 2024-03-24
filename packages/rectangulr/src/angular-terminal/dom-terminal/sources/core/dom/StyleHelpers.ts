import { style } from '../../../../../term-strings/core'
import { StyleValue } from './StyleHandler'

export namespace Position {
  export function isAbsolutelyPositioned(value: StyleValue['position']) {
    switch (value) {
      case 'absolute':
        return true
      case 'fixed':
        return true
      default:
        return false
    }
  }
}

export namespace Color {
  export function front(value): string {
    return style.color.front(value)
  }

  export function back(value): string {
    return style.color.back(value)
  }
}

export namespace BackgroundClip {
  export function doesIncludeBorders(value) {
    switch (value) {
      case 'borderBox':
        return true
      case 'paddingBox':
        return true
      case 'contentBox':
        return false
      default: {
        debugger
        throw new Error('doesIncludeBorders: invalid value')
      }
    }
  }
}
