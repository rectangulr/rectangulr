import * as _ from '@s-libs/micro-dash'
import { assert } from '../../../utils/Assert'
import { AnyObject } from '../../../utils/utils'
import { TermElement } from '../dom/TermElement'
import { YGNodeStyleSetFlexBasisAuto } from '../layout/typeflex/yoga'
import { StyleHandler, StyleValue, } from './StyleHandler'
import { character, color, length, number } from './styleParsers'
import {
  dirtyLayout,
  dirtyRendering,
  forwardToTextLayout,
  onNullSwitch
} from './styleTriggers'
import { StyleBackgroundClip } from './types/StyleBackgroundClip'
import { StyleDisplay } from './types/StyleDisplay'
import { StyleFlexDirection } from './types/StyleFlexDirection'
import { StyleJustifyContent } from './types/StyleJustifyContent'
import { StyleAlignContent, StyleAlignItems, StyleAlignSelf } from './types/style-layout/StyleFlexAlign'
import * as StyleMargin from './types/style-layout/StyleMargin'
import { StylePaddingBottom, StylePaddingLeft, StylePaddingRight, StylePaddingTop } from './types/style-layout/StylePadding'
import * as StylePosition from './types/style-layout/StylePosition'
import { StylePositionType } from './types/style-layout/StylePositionType'
import { parseValue, parseValueOrAuto, parseValueOrUndefined, ValueOrAuto } from './types/style-layout/parse'
import { StyleWhiteSpace } from './types/style-text/StyleWhiteSpace'


const pick = _.pick as (obj: any, ...keys: string[]) => any

let simple = ['+', '+', '+', '+', '-', '|']
let modern = ['┌', '┐', '└', '┘', '─', '│']
let strong = ['┏', '┓', '┗', '┛', '━', '┃']
let double = ['╔', '╗', '╚', '╝', '═', '║']
let block = ['▄', '▄', '▀', '▀', '▄', '█', '▀', '█']
let rounded = ['╭', '╮', '╰', '╯', '─', '│']

const borders = { simple, modern, strong, double, block, rounded }

export type StyleKey = keyof StyleValue

type Parser = ((value: any) => any) | boolean | null | number | string | AnyObject

export interface StyleProperty {
  parsers: Parser[]
  triggers?: ((node?: TermElement, newValue?: any, oldValue?: any) => void)[]
  initial: any
  default?: any
}

export let styles: { [key: string]: StyleProperty } = {
  display: StyleDisplay,
  alignContent: StyleAlignContent,
  alignItems: StyleAlignItems,
  alignSelf: StyleAlignSelf,
  justifyContent: StyleJustifyContent,
  flexDirection: StyleFlexDirection,
  position: StylePositionType,

  left: StylePosition.left,
  right: StylePosition.right,
  top: StylePosition.top,
  bottom: StylePosition.bottom,

  marginLeft: StyleMargin.left,
  marginRight: StyleMargin.right,
  marginTop: StyleMargin.top,
  marginBottom: StyleMargin.bottom,

  paddingLeft: StylePaddingLeft,
  paddingRight: StylePaddingRight,
  paddingTop: StylePaddingTop,
  paddingBottom: StylePaddingBottom,

  flexGrow: {
    parsers: [number],
    triggers: [dirtyLayout, (el: TermElement, value: number) => el.yogaNode.setFlexGrow(value)],
    initial: 0,
  },

  flexShrink: {
    parsers: [number],
    triggers: [dirtyLayout, (el: TermElement, value: number) => el.yogaNode.setFlexShrink(value)],
    initial: 1,
  },

  flexBasis: {
    parsers: [parseValueOrAuto],
    triggers: [dirtyLayout, (el: TermElement, value: ValueOrAuto) => {
      if (value == 'auto') {
        YGNodeStyleSetFlexBasisAuto(el.yogaNode.node)
      } else {
        el.yogaNode.setFlexBasis(value)
      }
    }],
    initial: 'auto',
  },

  width: {
    parsers: [parseValueOrAuto],
    triggers: [dirtyLayout, (el: TermElement, value: number) => el.yogaNode.setWidth(value)],
    initial: 'auto',
  },

  height: {
    parsers: [parseValueOrAuto],
    triggers: [dirtyLayout, (el: TermElement, value: number) => el.yogaNode.setHeight(value)],
    initial: 'auto',
  },

  minWidth: {
    parsers: [parseValue],
    triggers: [dirtyLayout, (el: TermElement, value: number) => el.yogaNode.setMinWidth(value)],
    initial: 0,
  },

  minHeight: {
    parsers: [parseValueOrUndefined],
    triggers: [dirtyLayout, (el: TermElement, value: number) => el.yogaNode.setMinHeight(value)],
    initial: 0,
  },

  maxWidth: {
    parsers: [parseValue, length.infinity],
    triggers: [dirtyLayout, (el: TermElement, value: number) => el.yogaNode.setMaxWidth(value)],
    initial: Infinity,
  },

  maxHeight: {
    parsers: [parseValue, length.infinity],
    triggers: [dirtyLayout, (el: TermElement, value: number) => el.yogaNode.setMaxHeight(value)],
    initial: Infinity,
  },

  borderLeftCharacter: {
    parsers: [character, null],
    triggers: [
      onNullSwitch(dirtyLayout),
      dirtyRendering,
      // forwardToYoga('setBorder', Yoga.EDGE_LEFT, value => (value !== null ? 1 : 0)),
    ],
    initial: null,
  },

  borderRightCharacter: {
    parsers: [character, null],
    triggers: [
      onNullSwitch(dirtyLayout),
      dirtyRendering,
      // forwardToYoga('setBorder', Yoga.EDGE_RIGHT, value => (value !== null ? 1 : 0)),
    ],
    initial: null,
  },

  borderTopCharacter: {
    parsers: [character, null],
    triggers: [
      onNullSwitch(dirtyLayout),
      dirtyRendering,
      // forwardToYoga('setBorder', Yoga.EDGE_TOP, value => (value !== null ? 1 : 0)),
    ],
    initial: null,
  },

  borderBottomCharacter: {
    parsers: [character, null],
    triggers: [
      onNullSwitch(dirtyLayout),
      dirtyRendering,
      // forwardToYoga('setBorder', Yoga.EDGE_BOTTOM, value => (value !== null ? 1 : 0)),
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

  textAlign: {
    parsers: [],
    triggers: [dirtyRendering, forwardToTextLayout('justifyText', value => value.isJustified)],
    initial: 'left',
  },

  bold: {
    parsers: [(value: boolean) => value],
    triggers: [dirtyRendering],
    initial: 'normal',
  },

  underline: {
    parsers: [(value: boolean) => value],
    triggers: [dirtyRendering],
    initial: 'none',
  },

  whiteSpace: StyleWhiteSpace,

  // overflowWrap: {
  //   parsers: [(value) => {
  //     if (value === 'break-word') return 'break-word'
  //     if (value === 'normal') return 'normal'
  //     throw new Error(`Invalid value for overflowWrap: ${value}`)
  //   }],
  //   triggers: [dirtyLayout],
  //   initial: 'normal',
  // },

  wrap: {
    parsers: [(value) => {
      if (value === 'wrap') return 'wrap'
      if (value === 'truncate-start') return 'truncate-start'
      if (value === 'truncate-middle') return 'truncate-middle'
      if (value === 'truncate-end') return 'truncate-end'
      if (value === null) return null
      throw new Error(`Invalid value for wrap: ${value}`)
    }],
    triggers: [dirtyLayout],
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
    parsers: [pick(StyleBackgroundClip, 'borderBox', 'paddingBox', 'contentBox')],
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

  scroll: {
    parsers: [(value: any) => {
      if (value === null) return null
      if (value === 'x') return 'x'
      if (value === 'y') return 'y'
      if (value === 'xy') return 'xy'
      throw new Error(`Invalid value for scroll: ${value}`)
    }],
    initial: null,
    default: null,
  },
}

export interface ComputedStyle {
  /** The name of the computed style. */
  name: string,
  /** A list of style keys that this computed style depdends on. */
  inKeys?: string[]
  /** A list of style keys that this computed style will produce. */
  outKeys?: string[]
  func: (style: StyleHandler, value: any) => StyleValue
}

export const computedStyles: { [name: string]: ComputedStyle } = {
  margin: {
    name: 'margin',
    func: (
      style,
      [marginTop, marginRight = marginTop, marginBottom = marginTop, marginLeft = marginRight]
    ) => ({ marginTop, marginRight, marginBottom, marginLeft }),
  },

  flex: {
    name: 'flex',
    func: (style, [flexGrow = 1, flexShrink = 1, flexBasis = 0]) => ({
      flexGrow,
      flexShrink,
      flexBasis,
    }),
  },

  border: {
    name: 'border',
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
    name: 'padding',
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
    name: 'background',
    func: (style, args) => {
      assert(Array.isArray(args), 'background must be an array')
      const backgroundCharacter = args[0] ?? style.get('backgroundCharacter')
      const backgroundColor = args[1] ?? style.get('backgroundColor')
      return { backgroundCharacter, backgroundColor }
    },
  },

  hgrow: {
    name: 'hgrow',
    func: (style, value) => grow(style, value, 'horizontal'),
  },

  vgrow: {
    name: 'vgrow',
    func: (style, value) => grow(style, value, 'vertical'),
  },

  scrollF: {
    name: 'scrollF',
    func: (style, value) => {
      if (value) {
        if (value == 'x' || value == 'xy') {
          return { maxWidth: '100%', scroll: value }
        }
        if (value == 'y' || value == 'xy') {
          return { maxHeight: '100%', scroll: value }
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
      return { alignSelf: 'stretch' }
    } else {
      return { flexGrow: 1 }
    }
  } else if (parentDirection == 'column') {
    if (direction == 'horizontal') {
      return { alignSelf: 'stretch' }
    } else {
      return { flexGrow: 1 }
    }
  }
}
