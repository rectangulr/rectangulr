"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.styleProperties = void 0;
const lodash_1 = require("lodash");
const Yoga = __importStar(require("yoga-layout"));
const styleParsers_1 = require("./styleParsers");
const styleTriggers_1 = require("./styleTriggers");
const StyleAlignment_1 = require("./types/StyleAlignment");
const StyleBackgroundClip_1 = require("./types/StyleBackgroundClip");
const StyleDecoration_1 = require("./types/StyleDecoration");
const StyleDisplay_1 = require("./types/StyleDisplay");
const StyleFlexAlignment_1 = require("./types/StyleFlexAlignment");
const StyleFlexDirection_1 = require("./types/StyleFlexDirection");
const StyleOverflow_1 = require("./types/StyleOverflow");
const StyleOverflowWrap_1 = require("./types/StyleOverflowWrap");
const StylePosition_1 = require("./types/StylePosition");
const StyleWeight_1 = require("./types/StyleWeight");
const StyleWhiteSpace_1 = require("./types/StyleWhiteSpace");
let simple = ['+', '+', '+', '+', '-', '|'];
let modern = ['┌', '┐', '└', '┘', '─', '│'];
let strong = ['┏', '┓', '┗', '┛', '━', '┃'];
let double = ['╔', '╗', '╚', '╝', '═', '║'];
let block = ['▄', '▄', '▀', '▀', '▄', '█', '▀', '█'];
let rounded = ['╭', '╮', '╰', '╯', '─', '│'];
exports.styleProperties = {
    display: {
        parsers: [lodash_1.pick(StyleDisplay_1.StyleDisplay, 'flex', 'none')],
        triggers: [
            styleTriggers_1.dirtyLayout,
            styleTriggers_1.onNullSwitch(styleTriggers_1.dirtyRenderList),
            styleTriggers_1.forwardToYoga('setDisplay', styleTriggers_1.forwardToYoga.value),
        ],
        initial: 'flex',
        default: 'flex',
    },
    alignContent: {
        parsers: [
            lodash_1.pick(StyleFlexAlignment_1.StyleFlexAlignment, 'flexStart', 'flexEnd', 'center', 'spaceBetween', 'spaceAround', 'stretch'),
        ],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setAlignContent', styleTriggers_1.forwardToYoga.value)],
        initial: 'stretch',
    },
    alignItems: {
        parsers: [lodash_1.pick(StyleFlexAlignment_1.StyleFlexAlignment, 'flexStart', 'flexEnd', 'center', 'baseline', 'stretch')],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setAlignItems', styleTriggers_1.forwardToYoga.value)],
        initial: 'stretch',
    },
    alignSelf: {
        parsers: [
            lodash_1.pick(StyleFlexAlignment_1.StyleFlexAlignment, 'auto', 'flexStart', 'flexEnd', 'center', 'baseline', 'stretch'),
        ],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setAlignSelf', styleTriggers_1.forwardToYoga.value)],
        initial: 'auto',
    },
    flexDirection: {
        parsers: [lodash_1.pick(StyleFlexDirection_1.StyleFlexDirection, 'row', 'column', 'rowReverse', 'columnReverse')],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setFlexDirection', styleTriggers_1.forwardToYoga.value)],
        initial: 'column',
    },
    position: {
        parsers: [lodash_1.pick(StylePosition_1.StylePosition, 'relative', 'sticky', 'absolute', 'fixed')],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setPositionType', styleTriggers_1.forwardToYoga.value)],
        initial: 'relative',
    },
    left: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.autoNaN],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setPosition', Yoga.EDGE_LEFT, styleTriggers_1.forwardToYoga.value)],
        initial: 'auto',
    },
    right: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.autoNaN],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setPosition', Yoga.EDGE_RIGHT, styleTriggers_1.forwardToYoga.value)],
        initial: 'auto',
    },
    top: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.autoNaN],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setPosition', Yoga.EDGE_TOP, styleTriggers_1.forwardToYoga.value)],
        initial: 'auto',
    },
    bottom: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.autoNaN],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setPosition', Yoga.EDGE_BOTTOM, styleTriggers_1.forwardToYoga.value)],
        initial: 'auto',
    },
    zIndex: {
        parsers: [styleParsers_1.number, null],
        triggers: [styleTriggers_1.dirtyRenderList],
        initial: null,
    },
    margin: {
        parsers: [styleParsers_1.repeat([1, 2, 4], [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.auto])],
        getter: style => [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft],
        setter: (style, [marginTop, marginRight = marginTop, marginBottom = marginTop, marginLeft = marginRight]) => Object.assign(style, { marginTop, marginRight, marginBottom, marginLeft }),
    },
    marginLeft: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.auto],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setMargin', Yoga.EDGE_LEFT, styleTriggers_1.forwardToYoga.value)],
        initial: 0,
    },
    marginRight: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.auto],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setMargin', Yoga.EDGE_RIGHT, styleTriggers_1.forwardToYoga.value)],
        initial: 0,
    },
    marginTop: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.auto],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setMargin', Yoga.EDGE_TOP, styleTriggers_1.forwardToYoga.value)],
        initial: 0,
    },
    marginBottom: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.auto],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setMargin', Yoga.EDGE_BOTTOM, styleTriggers_1.forwardToYoga.value)],
        initial: 0,
    },
    flex: {
        parsers: [
            styleParsers_1.list([styleParsers_1.number, styleParsers_1.optional(styleParsers_1.number), styleParsers_1.optional([styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.autoNaN])]),
            styleParsers_1.list([styleParsers_1.optional(styleParsers_1.number), styleParsers_1.optional(styleParsers_1.number), [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.autoNaN]]),
            new Map([[null, [0, 0, 'auto']]]),
        ],
        getter: style => [style.flexGrow, style.flexShrink, style.flexBasis],
        setter: (style, [flexGrow = 1, flexShrink = 1, flexBasis = 0]) => Object.assign(style, { flexGrow, flexShrink, flexBasis }, console.log(flexGrow, flexShrink, flexBasis)),
    },
    flexGrow: {
        parsers: [styleParsers_1.number],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setFlexGrow', lodash_1.identity)],
        initial: 0,
    },
    flexShrink: {
        parsers: [styleParsers_1.number],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setFlexShrink', lodash_1.identity)],
        initial: 1,
    },
    flexBasis: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.autoNaN],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setFlexBasis', styleTriggers_1.forwardToYoga.value)],
        initial: 'auto',
    },
    width: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.autoNaN],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setWidth', styleTriggers_1.forwardToYoga.value)],
        initial: 'auto',
    },
    height: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.autoNaN],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setHeight', styleTriggers_1.forwardToYoga.value)],
        initial: 'auto',
    },
    minWidth: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setMinWidth', styleTriggers_1.forwardToYoga.value)],
        initial: 0,
    },
    minHeight: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.autoNaN],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setMinHeight', styleTriggers_1.forwardToYoga.value)],
        initial: 0,
    },
    maxWidth: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.infinity],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setMaxWidth', styleTriggers_1.forwardToYoga.value)],
        initial: Infinity,
    },
    maxHeight: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel, styleParsers_1.length.infinity],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setMaxHeight', styleTriggers_1.forwardToYoga.value)],
        initial: Infinity,
    },
    overflow: {
        parsers: [lodash_1.pick(StyleOverflow_1.StyleOverflow, 'visible', 'hidden')],
        triggers: [styleTriggers_1.dirtyClipping],
        initial: 'hidden',
    },
    border: {
        parsers: [
            { simple, modern, strong, double, block, rounded },
            styleParsers_1.repeat([1, 2, 4, 5, 8], [styleParsers_1.character, null]),
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
        setter: (style, [borderTopLeftCharacter, borderTopRightCharacter, borderBottomLeftCharacter, borderBottomRightCharacter, borderTopCharacter, borderRightCharacter = borderTopCharacter, borderBottomCharacter = borderTopCharacter, borderLeftCharacter = borderRightCharacter,]) => Object.assign(style, {
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
            styleParsers_1.repeat([5, 6, 8], [styleParsers_1.character, null]),
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
        setter: (style, [borderTopLeftCharacter, borderTopRightCharacter, borderBottomLeftCharacter, borderBottomRightCharacter, borderTopCharacter, borderRightCharacter = borderTopCharacter, borderBottomCharacter = borderTopCharacter, borderLeftCharacter = borderRightCharacter,]) => Object.assign(style, {
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
        parsers: [styleParsers_1.character, null],
        triggers: [
            styleTriggers_1.onNullSwitch(styleTriggers_1.dirtyLayout),
            styleTriggers_1.dirtyRendering,
            styleTriggers_1.forwardToYoga('setBorder', Yoga.EDGE_LEFT, value => (value !== null ? 1 : 0)),
        ],
        initial: null,
    },
    borderRightCharacter: {
        parsers: [styleParsers_1.character, null],
        triggers: [
            styleTriggers_1.onNullSwitch(styleTriggers_1.dirtyLayout),
            styleTriggers_1.dirtyRendering,
            styleTriggers_1.forwardToYoga('setBorder', Yoga.EDGE_RIGHT, value => (value !== null ? 1 : 0)),
        ],
        initial: null,
    },
    borderTopCharacter: {
        parsers: [styleParsers_1.character, null],
        triggers: [
            styleTriggers_1.onNullSwitch(styleTriggers_1.dirtyLayout),
            styleTriggers_1.dirtyRendering,
            styleTriggers_1.forwardToYoga('setBorder', Yoga.EDGE_TOP, value => (value !== null ? 1 : 0)),
        ],
        initial: null,
    },
    borderBottomCharacter: {
        parsers: [styleParsers_1.character, null],
        triggers: [
            styleTriggers_1.onNullSwitch(styleTriggers_1.dirtyLayout),
            styleTriggers_1.dirtyRendering,
            styleTriggers_1.forwardToYoga('setBorder', Yoga.EDGE_BOTTOM, value => (value !== null ? 1 : 0)),
        ],
        initial: null,
    },
    borderTopLeftCharacter: {
        parsers: [styleParsers_1.character, null],
        triggers: [styleTriggers_1.onNullSwitch(styleTriggers_1.dirtyLayout), styleTriggers_1.dirtyRendering],
        initial: null,
    },
    borderTopRightCharacter: {
        parsers: [styleParsers_1.character, null],
        triggers: [styleTriggers_1.onNullSwitch(styleTriggers_1.dirtyLayout), styleTriggers_1.dirtyRendering],
        initial: null,
    },
    borderBottomLeftCharacter: {
        parsers: [styleParsers_1.character, null],
        triggers: [styleTriggers_1.onNullSwitch(styleTriggers_1.dirtyLayout), styleTriggers_1.dirtyRendering],
        initial: null,
    },
    borderBottomRightCharacter: {
        parsers: [styleParsers_1.character, null],
        triggers: [styleTriggers_1.onNullSwitch(styleTriggers_1.dirtyLayout), styleTriggers_1.dirtyRendering],
        initial: null,
    },
    padding: {
        parsers: [styleParsers_1.repeat([1, 2, 4], [styleParsers_1.length, styleParsers_1.length.rel])],
        getter: style => [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
        setter: (style, [paddingTop, paddingRight = paddingTop, paddingBottom = paddingTop, paddingLeft = paddingRight,]) => Object.assign(style, { paddingTop, paddingRight, paddingBottom, paddingLeft }),
    },
    paddingLeft: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setPadding', Yoga.EDGE_LEFT, styleTriggers_1.forwardToYoga.value)],
        initial: 0,
    },
    paddingRight: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setPadding', Yoga.EDGE_RIGHT, styleTriggers_1.forwardToYoga.value)],
        initial: 0,
    },
    paddingTop: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setPadding', Yoga.EDGE_TOP, styleTriggers_1.forwardToYoga.value)],
        initial: 0,
    },
    paddingBottom: {
        parsers: [styleParsers_1.length, styleParsers_1.length.rel],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToYoga('setPadding', Yoga.EDGE_BOTTOM, styleTriggers_1.forwardToYoga.value)],
        initial: 0,
    },
    fontWeight: {
        parsers: [lodash_1.pick(StyleWeight_1.StyleWeight, 'normal', 'bold')],
        triggers: [styleTriggers_1.dirtyRendering],
        initial: 'normal',
    },
    textAlign: {
        parsers: [lodash_1.pick(StyleAlignment_1.StyleAlignment, 'left', 'center', 'right', 'justify')],
        triggers: [styleTriggers_1.dirtyRendering, styleTriggers_1.forwardToTextLayout('justifyText', value => value.isJustified)],
        initial: 'left',
    },
    textDecoration: {
        parsers: [lodash_1.pick(StyleDecoration_1.StyleDecoration, 'underline'), null],
        triggers: [styleTriggers_1.dirtyRendering],
        initial: null,
    },
    whiteSpace: {
        parsers: [lodash_1.pick(StyleWhiteSpace_1.StyleWhiteSpace, 'normal', 'noWrap', 'pre', 'preWrap', 'preLine')],
        triggers: [
            styleTriggers_1.dirtyLayout,
            styleTriggers_1.forwardToTextLayout('collapseWhitespaces', value => value.doesCollapse),
            styleTriggers_1.forwardToTextLayout('demoteNewlines', value => value.doesDemoteNewlines),
            styleTriggers_1.forwardToTextLayout('preserveLeadingSpaces', value => !value.doesCollapse),
            styleTriggers_1.forwardToTextLayout('preserveTrailingSpaces', value => !value.doesCollapse),
            styleTriggers_1.forwardToTextLayout('softWrap', value => value.doesWrap),
        ],
        initial: 'normal',
    },
    overflowWrap: {
        parsers: [lodash_1.pick(StyleOverflowWrap_1.StyleOverflowWrap, 'normal', 'breakWord')],
        triggers: [styleTriggers_1.dirtyLayout, styleTriggers_1.forwardToTextLayout('allowWordBreaks', value => value.doesBreakWords)],
        initial: 'normal',
    },
    wordWrap: {
        parsers: [rawValue => rawValue],
        getter: style => {
            throw new Error('Please use the "overflow-wrap" property instead.');
        },
        setter: (style, wordWrap) => {
            throw new Error('Please use the "overflow-wrap" property instead.');
        },
    },
    color: {
        parsers: [styleParsers_1.color, null],
        triggers: [styleTriggers_1.dirtyRendering],
        initial: 'inherit',
        default: null,
    },
    borderColor: {
        parsers: [styleParsers_1.color, null],
        triggers: [styleTriggers_1.dirtyRendering],
        initial: null,
    },
    background: {
        parsers: [
            styleParsers_1.list([styleParsers_1.optional(styleParsers_1.character), styleParsers_1.color]),
            styleParsers_1.list([styleParsers_1.character, styleParsers_1.optional(styleParsers_1.color)]),
            new Map([[null, [null, ' ']]]),
        ],
        getter: style => [style.backgroundCharacter, style.backgroundColor],
        setter: (style, [backgroundCharacter = style.backgroundCharacter, backgroundColor = style.backgroundColor]) => Object.assign(style, { backgroundCharacter, backgroundColor }),
    },
    backgroundClip: {
        parsers: [lodash_1.pick(StyleBackgroundClip_1.StyleBackgroundClip, 'borderBox', 'paddingBox', 'contentBox')],
        triggers: [styleTriggers_1.dirtyRendering],
        initial: 'borderBox',
    },
    backgroundColor: {
        parsers: [styleParsers_1.color, null],
        triggers: [styleTriggers_1.dirtyRendering],
        initial: 'inherit',
        default: null,
    },
    backgroundCharacter: {
        parsers: [styleParsers_1.character],
        triggers: [styleTriggers_1.dirtyRendering],
        initial: ' ',
    },
    focusEvents: {
        parsers: [true, null],
        triggers: [styleTriggers_1.dirtyFocusList],
        initial: null,
    },
    pointerEvents: {
        parsers: [true, null],
        triggers: [],
        initial: true,
    },
    scroll: {
        parsers: [true, null],
        triggers: [],
        initial: null,
    },
};
