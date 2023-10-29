import { Directive, ElementRef, Input, Signal, computed } from '@angular/core'
import { unwrapIfFunction, unwrapIfSignal } from '../../utils/utils'
import { TermElement } from '../../angular-terminal/dom-terminal'

export interface IStyle {
  display?: 'flex' | 'none'
  alignContent?: 'flexStart' | 'flexEnd' | 'center' | 'spaceBetween' | 'spaceAround' | 'stretch'
  alignItems?: 'flexStart' | 'flexEnd' | 'center' | 'baseline' | 'stretch'
  alignSelf?: 'auto' | 'flexStart' | 'flexEnd' | 'center' | 'baseline' | 'stretch'
  flexDirection?: 'row' | 'column' | 'rowReverse' | 'columnReverse'
  position?: 'relative' | 'sticky' | 'absolute' | 'fixed'
  left?: string | number
  right?: string | number
  top?: string | number
  bottom?: string | number
  zIndex?: number
  margin?: string | number | (string | number)[]
  marginLeft?: string | number
  marginRight?: string | number
  marginTop?: string | number
  marginBottom?: string | number
  // flex?: (string)[],
  flexGrow?: number
  flexShrink?: number
  flexBasis?: number
  width?: string | number
  height?: number | string
  minWidth?: string | number
  minHeight?: string | number
  maxWidth?: string | number
  maxHeight?: string | number
  overflow?: 'visible' | 'hidden'
  border?: 'simple' | 'modern' | 'strong' | 'double' | 'block' | 'rounded'
  // borderCharacter?,
  borderLeftCharacter?: string | null
  borderRightCharacter?: string | null
  borderTopCharacter?: string | null
  borderBottomCharacter?: string | null
  borderTopLeftCharacter?: string | null
  borderTopRightCharacter?: string | null
  borderBottomLeftCharacter?: string | null
  borderBottomRightCharacter?: string | null
  padding?: (string | number)[]
  paddingLeft?: string | number
  paddingRight?: string | number
  paddingTop?: string | number
  paddingBottom?: string | number
  fontWeight?: 'normal' | 'bold' | 'fainted'
  textAlign?: 'left' | 'center' | 'right' | 'justify',
  textDecoration?: 'underline' | null
  // whiteSpace?: ,
  // overflowWrap?: ,
  color?: Color
  borderColor?: Color
  // background?,
  backgroundClip?: 'borderBox' | 'paddingBox' | 'contentBox'
  backgroundColor?: Color
  backgroundCharacter?: string
  // focusEvents?: boolean
  pointerEvents?: boolean

  scroll?: true | null | 'x' | 'y'
  hgrow?: boolean
  vgrow?: boolean
  justifyContent?: 'flexStart' | 'flexEnd' | 'center' | 'baseline' | 'stretch'
  wrap?: 'wrap' | null
}

export type Color = string | null

/**
 * Applies a style to the element.
 * @example
 * <h [s]="{color: 'red'}">Some red text</h>
 */
@Directive({
  standalone: true,
  selector: '[s]',
})
export class StyleDirective {
  @Input() s: IStyle | Signal<IStyle> | (IStyle | Signal<IStyle>)[]

  constructor(public element: ElementRef<TermElement>) { }

  ngOnInit() {
    if (Array.isArray(this.s)) {
      for (const style of this.s) {
        this.element.nativeElement.style.add(style)
      }
    } else {
      this.element.nativeElement.style.add(this.s)
    }
  }
}

export function cond(condition: Signal<any> | any | ((...args) => boolean), style: IStyle) {
  return computed(() => {
    if (unwrapIfFunction(condition)) {
      return style
    } else {
      return {}
    }
  })
}

export function eq(value1, value2) {
  return () => value1 == value2
}

export function neq(value1, value2) {
  return () => value1 != value2
}