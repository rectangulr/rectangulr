import { style } from '../../../../../term-strings/core'
import { StyleValue } from './StyleHandler'

export const Position = {
  isAbsolutelyPositioned(value: StyleValue['position']) {
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

export const Color = {
  front(value): string {
    return style.color.front(value)
  },

  back(value): string {
    return style.color.back(value)
  }
}

export const BackgroundClip = {
  doesIncludeBorders(value) {
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
