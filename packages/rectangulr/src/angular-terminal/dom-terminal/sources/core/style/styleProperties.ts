import { Signal } from '@angular/core'
import _ from 'lodash-es'
import * as Yoga from 'typeflex'
import { TermElement } from '../dom/Element'
import { StyleHandler, StyleValue, } from '../dom/StyleHandler'
import { character, color, length, number } from './styleParsers'
import {
  dirtyClipping,
  dirtyLayout,
  dirtyRenderList,
  dirtyRendering,
  forwardToTextLayout,
  forwardToYoga,
  onNullSwitch,
} from './styleTriggers'
import { StyleAlignment } from './types/StyleAlignment'
import { StyleBackgroundClip } from './types/StyleBackgroundClip'
import { StyleDecoration } from './types/StyleDecoration'
import { StyleDisplay } from './types/StyleDisplay'
import { StyleFlexAlignment } from './types/StyleFlexAlignment'
import { StyleFlexDirection } from './types/StyleFlexDirection'
import { StyleFlexJustify } from './types/StyleFlexJustify'
import { StyleOverflowWrap } from './types/StyleOverflowWrap'
import { StylePosition } from './types/StylePosition'
import { StyleWeight } from './types/StyleWeight'
import { StyleWhiteSpace } from './types/StyleWhiteSpace'
import { assert } from '../../../../../utils/utils'
import { StyleOverflow } from './types/StyleOverflow'

let simple = ['+', '+', '+', '+', '-', '|']
let modern = ['┌', '┐', '└', '┘', '─', '│']
let strong = ['┏', '┓', '┗', '┛', '━', '┃']
let double = ['╔', '╗', '╚', '╝', '═', '║']
let block = ['▄', '▄', '▀', '▀', '▄', '█', '▀', '█']
let rounded = ['╭', '╮', '╰', '╯', '─', '│']

const borders = { simple, modern, strong, double, block, rounded }

export type StyleKey = keyof StyleValue

export interface StyleProperty {
  parsers: any[]
  triggers?: ((node?: TermElement, newValue?: any, oldValue?: any) => void)[]
  initial: any
  default?: any
}

export let styles: { [key: string]: StyleProperty } = {
  display: {
    parsers: [_.pick(StyleDisplay, 'flex', 'none')],
    triggers: [dirtyLayout, dirtyRenderList, forwardToYoga('setDisplay', forwardToYoga.value)],
    initial: 'flex',
    default: 'flex',
  },

  alignContent: {
    parsers: [
      _.pick(
        StyleFlexAlignment,
        'flexStart',
        'flexEnd',
        'center',
        'spaceBetween',
        'spaceAround',
        'stretch'
      ),
    ],
    triggers: [dirtyLayout, forwardToYoga('setAlignContent', forwardToYoga.value)],
    initial: 'flexStart',
  },

  alignItems: {
    parsers: [
      _.pick(
        StyleFlexAlignment,
        'flexStart',
        'flexEnd',
        'center',
        'stretch',
        'spaceAround',
        'spaceBetween'
      ),
    ],
    triggers: [dirtyLayout, forwardToYoga('setAlignItems', forwardToYoga.value)],
    initial: 'flexStart',
  },

  alignSelf: {
    parsers: [
      _.pick(
        StyleFlexAlignment,
        'auto',
        'flexStart',
        'flexEnd',
        'center',
        'stretch',
        'spaceAround',
        'spaceBetween'
      ),
    ],
    triggers: [dirtyLayout, forwardToYoga('setAlignSelf', forwardToYoga.value)],
    initial: 'auto',
  },

  justifyContent: {
    parsers: [
      _.pick(
        StyleFlexJustify,
        'flexStart',
        'flexEnd',
        'center',
        'spaceBetween',
        'spaceAround',
        'spaceEvenly'
      ),
    ],
    triggers: [dirtyLayout, forwardToYoga('setJustifyContent', forwardToYoga.value)],
    initial: 'flexStart',
  },

  flexDirection: {
    parsers: [_.pick(StyleFlexDirection, 'row', 'column', 'rowReverse', 'columnReverse')],
    triggers: [dirtyLayout, forwardToYoga('setFlexDirection', forwardToYoga.value)],
    initial: 'column',
  },

  position: {
    parsers: [_.pick(StylePosition, 'relative', 'sticky', 'absolute', 'fixed')],
    triggers: [dirtyLayout, forwardToYoga('setPositionType', forwardToYoga.value)],
    initial: 'relative',
  },

  left: {
    parsers: [length, length.rel, length.autoNaN],
    triggers: [dirtyLayout, forwardToYoga('setPosition', Yoga.EDGE_LEFT, forwardToYoga.value)],
    initial: 'auto',
  },

  right: {
    parsers: [length, length.rel, length.autoNaN],
    triggers: [dirtyLayout, forwardToYoga('setPosition', Yoga.EDGE_RIGHT, forwardToYoga.value)],
    initial: 'auto',
  },

  top: {
    parsers: [length, length.rel, length.autoNaN],
    triggers: [dirtyLayout, forwardToYoga('setPosition', Yoga.EDGE_TOP, forwardToYoga.value)],
    initial: 'auto',
  },

  bottom: {
    parsers: [length, length.rel, length.autoNaN],
    triggers: [dirtyLayout, forwardToYoga('setPosition', Yoga.EDGE_BOTTOM, forwardToYoga.value)],
    initial: 'auto',
  },

  zIndex: {
    parsers: [number, null],
    triggers: [dirtyRenderList],
    initial: null,
  },

  marginLeft: {
    parsers: [length, length.rel, length.auto],
    triggers: [dirtyLayout, forwardToYoga('setMargin', Yoga.EDGE_LEFT, forwardToYoga.value)],
    initial: 0,
  },

  marginRight: {
    parsers: [length, length.rel, length.auto],
    triggers: [dirtyLayout, forwardToYoga('setMargin', Yoga.EDGE_RIGHT, forwardToYoga.value)],
    initial: 0,
  },

  marginTop: {
    parsers: [length, length.rel, length.auto],
    triggers: [dirtyLayout, forwardToYoga('setMargin', Yoga.EDGE_TOP, forwardToYoga.value)],
    initial: 0,
  },

  marginBottom: {
    parsers: [length, length.rel, length.auto],
    triggers: [dirtyLayout, forwardToYoga('setMargin', Yoga.EDGE_BOTTOM, forwardToYoga.value)],
    initial: 0,
  },

  flexGrow: {
    parsers: [number],
    triggers: [dirtyLayout, forwardToYoga('setFlexGrow', value => value)],
    initial: 0,
  },

  flexShrink: {
    parsers: [number],
    triggers: [dirtyLayout, forwardToYoga('setFlexShrink', value => value)],
    initial: 1,
  },

  flexBasis: {
    parsers: [length, length.rel, length.autoNaN],
    triggers: [dirtyLayout, forwardToYoga('setFlexBasis', forwardToYoga.value)],
    initial: 'auto',
  },

  width: {
    parsers: [length, length.rel, length.autoNaN],
    triggers: [dirtyLayout, forwardToYoga('setWidth', forwardToYoga.value)],
    initial: 'auto',
  },

  height: {
    parsers: [length, length.rel, length.autoNaN],
    triggers: [dirtyLayout, forwardToYoga('setHeight', forwardToYoga.value)],
    initial: 'auto',
  },

  minWidth: {
    parsers: [length, length.rel],
    triggers: [dirtyLayout, forwardToYoga('setMinWidth', forwardToYoga.value)],
    initial: 0,
  },

  minHeight: {
    parsers: [length, length.rel, length.autoNaN],
    triggers: [dirtyLayout, forwardToYoga('setMinHeight', forwardToYoga.value)],
    initial: 0,
  },

  maxWidth: {
    parsers: [length, length.rel, length.infinity],
    triggers: [dirtyLayout, forwardToYoga('setMaxWidth', forwardToYoga.value)],
    initial: Infinity,
  },

  maxHeight: {
    parsers: [length, length.rel, length.infinity],
    triggers: [dirtyLayout, forwardToYoga('setMaxHeight', forwardToYoga.value)],
    initial: Infinity,
  },

  overflow: {
    parsers: [_.pick(StyleOverflow, 'visible', 'hidden')],
    triggers: [dirtyClipping],
    initial: 'inherit',
    default: 'visible',
  },

  borderLeftCharacter: {
    parsers: [character, null],
    triggers: [
      onNullSwitch(dirtyLayout),
      dirtyRendering,
      forwardToYoga('setBorder', Yoga.EDGE_LEFT, value => (value !== null ? 1 : 0)),
    ],
    initial: null,
  },

  borderRightCharacter: {
    parsers: [character, null],
    triggers: [
      onNullSwitch(dirtyLayout),
      dirtyRendering,
      forwardToYoga('setBorder', Yoga.EDGE_RIGHT, value => (value !== null ? 1 : 0)),
    ],
    initial: null,
  },

  borderTopCharacter: {
    parsers: [character, null],
    triggers: [
      onNullSwitch(dirtyLayout),
      dirtyRendering,
      forwardToYoga('setBorder', Yoga.EDGE_TOP, value => (value !== null ? 1 : 0)),
    ],
    initial: null,
  },

  borderBottomCharacter: {
    parsers: [character, null],
    triggers: [
      onNullSwitch(dirtyLayout),
      dirtyRendering,
      forwardToYoga('setBorder', Yoga.EDGE_BOTTOM, value => (value !== null ? 1 : 0)),
    ],
    initial: null,
  },

  borderTopLeftCharacter: {
    parsers: [character, null],
    triggers: [onNullSwitch(dirtyLayout), dirtyRendering],
    initial: null,
  },

  borderTopRightCharacter: {
    parsers: [character, null],
    triggers: [onNullSwitch(dirtyLayout), dirtyRendering],
    initial: null,
  },

  borderBottomLeftCharacter: {
    parsers: [character, null],
    triggers: [onNullSwitch(dirtyLayout), dirtyRendering],
    initial: null,
  },

  borderBottomRightCharacter: {
    parsers: [character, null],
    triggers: [onNullSwitch(dirtyLayout), dirtyRendering],
    initial: null,
  },

  paddingLeft: {
    parsers: [length, length.rel],
    triggers: [dirtyLayout, forwardToYoga('setPadding', Yoga.EDGE_LEFT, forwardToYoga.value)],
    initial: 0,
  },

  paddingRight: {
    parsers: [length, length.rel],
    triggers: [dirtyLayout, forwardToYoga('setPadding', Yoga.EDGE_RIGHT, forwardToYoga.value)],
    initial: 0,
  },

  paddingTop: {
    parsers: [length, length.rel],
    triggers: [dirtyLayout, forwardToYoga('setPadding', Yoga.EDGE_TOP, forwardToYoga.value)],
    initial: 0,
  },

  paddingBottom: {
    parsers: [length, length.rel],
    triggers: [dirtyLayout, forwardToYoga('setPadding', Yoga.EDGE_BOTTOM, forwardToYoga.value)],
    initial: 0,
  },

  fontWeight: {
    parsers: [_.pick(StyleWeight, 'normal', 'bold')],
    triggers: [dirtyRendering],
    initial: 'normal',
  },

  textAlign: {
    parsers: [_.pick(StyleAlignment, 'left', 'center', 'right', 'justify')],
    triggers: [dirtyRendering, forwardToTextLayout('justifyText', value => value.isJustified)],
    initial: 'left',
  },

  textDecoration: {
    parsers: [_.pick(StyleDecoration, 'underline'), null],
    triggers: [dirtyRendering],
    initial: null,
  },

  whiteSpace: {
    parsers: [_.pick(StyleWhiteSpace, 'normal', 'noWrap', 'pre', 'preWrap', 'preLine')],
    triggers: [
      dirtyLayout,
      forwardToTextLayout('collapseWhitespaces', value => value.doesCollapse),
      forwardToTextLayout('demoteNewlines', value => value.doesDemoteNewlines),
      forwardToTextLayout('preserveLeadingSpaces', value => !value.doesCollapse),
      forwardToTextLayout('preserveTrailingSpaces', value => !value.doesCollapse),
      forwardToTextLayout('softWrap', value => value.doesWrap),
    ],
    initial: 'normal',
  },

  overflowWrap: {
    parsers: [_.pick(StyleOverflowWrap, 'normal', 'breakWord')],
    triggers: [dirtyLayout, forwardToTextLayout('allowWordBreaks', value => value.doesBreakWords)],
    initial: 'normal',
  },

  wrap: {
    parsers: [null, 'wrap', 'truncate-start', 'truncate-middle', 'truncate-end'],
    triggers: [dirtyLayout, forwardToTextLayout('wrap', value => value)],
    initial: 'inherit',
    default: null,
  },

  color: {
    parsers: [color, null],
    triggers: [dirtyRendering],
    initial: 'inherit',
    default: null,
  },

  borderColor: {
    parsers: [color, null],
    triggers: [dirtyRendering],
    initial: null,
  },

  backgroundClip: {
    parsers: [_.pick(StyleBackgroundClip, 'borderBox', 'paddingBox', 'contentBox')],
    triggers: [dirtyRendering],
    initial: 'borderBox',
  },

  backgroundColor: {
    parsers: [color, null],
    triggers: [dirtyRendering],
    initial: 'inherit',
    default: null,
  },

  backgroundCharacter: {
    parsers: [character],
    triggers: [dirtyRendering],
    initial: ' ',
  },

  pointerEvents: {
    parsers: [true, null],
    triggers: [],
    initial: true,
  },

  scroll: {
    parsers: [null, 'x', 'y', 'xy'],
    initial: null,
    default: null,
  },
}

export interface ComputedStyle {
  /** A list of style keys that this computed style depdends on. */
  inKeys?: string[]
  /** A list of style keys that this computed style will produce. */
  outKeys?: string[]
  func: (style: StyleHandler, value: any) => StyleValue
}

export const computedStyles: { [name: string]: ComputedStyle } = {
  margin: {
    func: (
      style,
      [marginTop, marginRight = marginTop, marginBottom = marginTop, marginLeft = marginRight]
    ) => ({ marginTop, marginRight, marginBottom, marginLeft }),
  },

  flex: {
    func: (style, [flexGrow = 1, flexShrink = 1, flexBasis = 0]) => ({
      flexGrow,
      flexShrink,
      flexBasis,
    }),
  },

  border: {
    func: (style, value) => {
      const [
        borderTopLeftCharacter,
        borderTopRightCharacter,
        borderBottomLeftCharacter,
        borderBottomRightCharacter,
        borderTopCharacter,
        borderRightCharacter = borderTopCharacter,
        borderBottomCharacter = borderTopCharacter,
        borderLeftCharacter = borderRightCharacter,
      ] = borders[value]
      return {
        borderTopLeftCharacter,
        borderTopRightCharacter,
        borderBottomLeftCharacter,
        borderBottomRightCharacter,
        borderTopCharacter,
        borderRightCharacter,
        borderBottomCharacter,
        borderLeftCharacter,
      }
    },
  },

  padding: {
    func: (
      style,
      [
        paddingTop,
        paddingRight = paddingTop,
        paddingBottom = paddingTop,
        paddingLeft = paddingRight,
      ]
    ) => ({ paddingTop, paddingRight, paddingBottom, paddingLeft }),
  },

  background: {
    func: (
      style,
      [
        backgroundCharacter = style.get('backgroundCharacter'),
        backgroundColor = style.get('backgroundColor'),
      ]
    ) => ({ backgroundCharacter, backgroundColor }),
  },

  hgrow: {
    func: (style, value) => grow(style, value, 'horizontal'),
  },

  vgrow: {
    func: (style, value) => grow(style, value, 'vertical'),
  },

  scrollF: {
    func: (style, value) => {
      if (value) {
        if (value == 'x' || value == 'xy') {
          // node.yogaNode.setMaxWidth(Number.MAX_SAFE_INTEGER)
          return { maxWidth: Number.MAX_SAFE_INTEGER, scroll: value }
        }
        if (value == 'y' || value == 'xy') {
          // node.yogaNode.setMaxHeight(Number.MAX_SAFE_INTEGER)
          return { maxHeight: Number.MAX_SAFE_INTEGER, scroll: value }
        }
      } else {
        return {}
      }
    },
  },
}

export function isComputedStyle(key: string) {
  return Object.keys(computedStyles).includes(key)
}

/**
 * Looks at the parent flex direction and decides what style to apply to make the node grow along the specified direction.
 * @returns The style to apply to make it grow accordingly.
 */
function grow(
  style: StyleHandler,
  value: boolean,
  direction: 'vertical' | 'horizontal'
): StyleValue {
  if (value == false) return {}
  if (!style.element.parentNode) {
    // In case `vgrow` is placed on the top level DOM element
    return {}
    // throw new Error('cant use grow on an element without a parent')
  }

  const parentDirection = style.element.parentNode.style.get('flexDirection')
  assert(parentDirection)
  if (parentDirection == 'row') {
    if (direction == 'vertical') {
      // style.element.yogaNode.setAlignSelf(Yoga.ALIGN_STRETCH)
      return { alignSelf: 'stretch' }
    } else {
      // node.yogaNode.setFlexGrow(1)
      return { flexGrow: 1 }
    }
  } else if (parentDirection == 'column') {
    if (direction == 'horizontal') {
      // node.yogaNode.setAlignSelf(Yoga.ALIGN_STRETCH)
      return { alignSelf: 'stretch' }
    } else {
      // node.yogaNode.setFlexGrow(1)
      return { flexGrow: 1 }
    }
  }
}
