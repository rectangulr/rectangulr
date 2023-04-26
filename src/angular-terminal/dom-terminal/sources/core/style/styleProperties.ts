import _ from 'lodash'
import * as Yoga from 'yoga-layout-prebuilt'
import { character, color, length, list, number, optional, repeat } from './styleParsers'
import {
  dirtyClipping,
  dirtyFocusList,
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
import { StyleOverflow } from './types/StyleOverflow'
import { StyleOverflowWrap } from './types/StyleOverflowWrap'
import { StylePosition } from './types/StylePosition'
import { StyleWeight } from './types/StyleWeight'
import { StyleWhiteSpace } from './types/StyleWhiteSpace'
import { Element } from '../dom/Element'

let simple = ['+', '+', '+', '+', '-', '|']
let modern = ['┌', '┐', '└', '┘', '─', '│']
let strong = ['┏', '┓', '┗', '┛', '━', '┃']
let double = ['╔', '╗', '╚', '╝', '═', '║']
let block = ['▄', '▄', '▀', '▀', '▄', '█', '▀', '█']
let rounded = ['╭', '╮', '╰', '╯', '─', '│']

export interface StyleProperty {
  parsers: any[]
  triggers?: any[]
  initial?: any
  getter?: (style) => any
  setter?: (style, value) => void
  default?: any
}

export let styleProperties: { [name: string]: StyleProperty } = {
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
    parsers: [_.pick(StyleFlexAlignment, 'flexStart', 'flexEnd', 'center', 'baseline', 'stretch')],
    triggers: [dirtyLayout, forwardToYoga('setAlignItems', forwardToYoga.value)],
    initial: 'flexStart',
  },

  alignSelf: {
    parsers: [
      _.pick(StyleFlexAlignment, 'auto', 'flexStart', 'flexEnd', 'center', 'baseline', 'stretch'),
    ],
    triggers: [dirtyLayout, forwardToYoga('setAlignSelf', forwardToYoga.value)],
    initial: 'auto',
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

  margin: {
    parsers: [repeat([1, 2, 4], [length, length.rel, length.auto])],
    getter: style => [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft],
    setter: (
      style,
      [marginTop, marginRight = marginTop, marginBottom = marginTop, marginLeft = marginRight]
    ) => Object.assign(style, { marginTop, marginRight, marginBottom, marginLeft }),
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

  flex: {
    parsers: [
      list([number, optional(number), optional([length, length.rel, length.autoNaN])]),
      list([optional(number), optional(number), [length, length.rel, length.autoNaN]]),
      new Map([[null, [0, 0, 'auto']]]),
    ],
    getter: style => [style.flexGrow, style.flexShrink, style.flexBasis],
    setter: (style, [flexGrow = 1, flexShrink = 1, flexBasis = 0]) =>
      Object.assign(
        style,
        { flexGrow, flexShrink, flexBasis },
        console.log(flexGrow, flexShrink, flexBasis)
      ),
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

  // overflow: {
  //   parsers: [_.pick(StyleOverflow, 'visible', 'hidden')],
  //   triggers: [dirtyClipping],
  //   initial: 'inherit',
  //   default: 'visible',
  // },

  border: {
    parsers: [
      { simple, modern, strong, double, block, rounded },
      repeat([1, 2, 4, 5, 8], [character, null]),
    ],
    getter: style => [
      style.borderTopLeftCharacter,
      style.borderTopRightCharacter,
      style.borderBottomLeftCharacter,
      style.borderBottomRightCharacter,
      style.borderTopCharacter,
      style.borderRightCharacter,
      style.borderBottomCharacter,
      style.borderLeftCharacter,
    ],
    setter: (
      style,
      [
        borderTopLeftCharacter,
        borderTopRightCharacter,
        borderBottomLeftCharacter,
        borderBottomRightCharacter,
        borderTopCharacter,
        borderRightCharacter = borderTopCharacter,
        borderBottomCharacter = borderTopCharacter,
        borderLeftCharacter = borderRightCharacter,
      ]
    ) =>
      Object.assign(style, {
        borderTopLeftCharacter,
        borderTopRightCharacter,
        borderBottomLeftCharacter,
        borderBottomRightCharacter,
        borderTopCharacter,
        borderRightCharacter,
        borderBottomCharacter,
        borderLeftCharacter,
      }),
  },

  borderCharacter: {
    parsers: [
      { simple, modern, strong, double, block, rounded },
      repeat([5, 6, 8], [character, null]),
    ],
    getter: style => [
      style.borderTopLeftCharacter,
      style.borderTopRightCharacter,
      style.borderBottomLeftCharacter,
      style.borderBottomRightCharacter,
      style.borderTopCharacter,
      style.borderRightCharacter,
      style.borderBottomCharacter,
      style.borderLeftCharacter,
    ],
    setter: (
      style,
      [
        borderTopLeftCharacter,
        borderTopRightCharacter,
        borderBottomLeftCharacter,
        borderBottomRightCharacter,
        borderTopCharacter,
        borderRightCharacter = borderTopCharacter,
        borderBottomCharacter = borderTopCharacter,
        borderLeftCharacter = borderRightCharacter,
      ]
    ) =>
      Object.assign(style, {
        borderTopLeftCharacter,
        borderTopRightCharacter,
        borderBottomLeftCharacter,
        borderBottomRightCharacter,
        borderTopCharacter,
        borderRightCharacter,
        borderBottomCharacter,
        borderLeftCharacter,
      }),
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

  padding: {
    parsers: [repeat([1, 2, 4], [length, length.rel])],
    getter: style => [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
    setter: (
      style,
      [
        paddingTop,
        paddingRight = paddingTop,
        paddingBottom = paddingTop,
        paddingLeft = paddingRight,
      ]
    ) => Object.assign(style, { paddingTop, paddingRight, paddingBottom, paddingLeft }),
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

  background: {
    parsers: [
      list([optional(character), color]),
      list([character, optional(color)]),
      new Map([[null, [null, ' ']]]),
    ],
    getter: style => [style.backgroundCharacter, style.backgroundColor],
    setter: (
      style,
      [backgroundCharacter = style.backgroundCharacter, backgroundColor = style.backgroundColor]
    ) => Object.assign(style, { backgroundCharacter, backgroundColor }),
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

  focusEvents: {
    parsers: [true, null],
    triggers: [dirtyFocusList],
    initial: null,
  },

  pointerEvents: {
    parsers: [true, null],
    triggers: [],
    initial: true,
  },

  scroll: {
    parsers: [true, null, 'x', 'y'],
    triggers: [
      (node: Element, value) => {
        if (value === true || value == 'x') {
          node.yogaNode.setMaxWidth(Number.MAX_SAFE_INTEGER)
        }
        if (value === true || value == 'y') {
          node.yogaNode.setMaxHeight(Number.MAX_SAFE_INTEGER)
        }
      },
    ],
    initial: null,
    default: null,
  },

  hgrow: {
    parsers: [true, false],
    triggers: [dirtyLayout, (node, value) => grow(node, value, 'horizontal')],
    initial: false,
  },

  vgrow: {
    parsers: [true, false],
    triggers: [dirtyLayout, (node, value) => grow(node, value, 'vertical')],
    initial: false,
  },

  justifyContent: {
    parsers: ['flexStart', 'flexEnd', 'center', 'baseline', 'stretch'],
    triggers: [dirtyLayout, forwardToYoga('setJustifyContent', value => value)],
    initial: 'flexStart',
  },
}

function grow(node: Element, value: boolean, direction: 'vertical' | 'horizontal') {
  if (value == false) return
  if (!node.parentNode) return

  const flexDirection = (node.parentNode as Element).yogaNode.getFlexDirection()
  if (
    flexDirection == Yoga.FLEX_DIRECTION_ROW ||
    flexDirection == Yoga.FLEX_DIRECTION_ROW_REVERSE
  ) {
    if (direction == 'vertical') {
      node.yogaNode.setAlignSelf(Yoga.ALIGN_STRETCH)
    } else {
      node.yogaNode.setFlexGrow(1)
    }
  } else if (
    flexDirection == Yoga.FLEX_DIRECTION_COLUMN ||
    flexDirection == Yoga.FLEX_DIRECTION_COLUMN_REVERSE
  ) {
    if (direction == 'horizontal') {
      node.yogaNode.setAlignSelf(Yoga.ALIGN_STRETCH)
    } else {
      node.yogaNode.setFlexGrow(1)
    }
  }
}
