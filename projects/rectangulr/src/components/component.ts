import { Directive, ElementRef, Input } from '@angular/core'
import { onChange } from '../utils/reactivity'

/**
 * Does nothing. Just there for autocompletion and type checking.
 * This element is handled by the renderer.
 * @example
 * <box>Some text</box>
 */
@Directive({
  selector: 'box',
})
export class BoxDirective {}

export interface IStyle extends Object {
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
  fontWeight?: 'normal' | 'bold'
  // textAlign?: ,
  textDecoration?: 'underline' | null
  // whiteSpace?: ,
  // overflowWrap?: ,
  color?: string | null
  borderColor?: string | null
  // background?,
  backgroundClip?: 'borderBox' | 'paddingBox' | 'contentBox'
  backgroundColor?: string | null
  backgroundCharacter?: string
  focusEvents?: boolean
  pointerEvents?: boolean
  scroll?: boolean
}

/**
 * Does nothing. Just there for autocompletion and type checking.
 * This behavior is handled by the renderer.
 * @example
 * <box [style]="{color: 'red'}">Some red text</box>
 */
@Directive({
  selector: '[style]',
})
export class StyleDirective {
  @Input() style: IStyle
}

/**
 * Does nothing. Just there for autocompletion and type checking.
 * This behavior is handled by the renderer.
 * @example
 * <box [styles]="{color: 'red'}">Some red text</box>
 */
@Directive({
  selector: '[styles]',
})
export class StylesDirective {
  @Input() style: IStyle
}

/**
 *
 */
@Directive({
  selector: '[newclasses]',
})
export class ClassesDirective {
  @Input() newclasses: any[]

  constructor(public element: ElementRef) {
    onChange(this, 'newclasses', (classes: IStyle[] | IStyle[]) => {
      const enabledClasses = classes
        .map(item => {
          if (Array.isArray(item)) {
            const [klass, condition] = item
            return condition ? klass : null
          } else {
            return item
          }
        })
        .filter(t => t)

      const newStyle = {}
      enabledClasses.forEach(klass => {
        Object.entries(klass).forEach(([key, value]) => {
          newStyle[key] = value
        })
      })

      this.element.nativeElement.style.$
    })
  }
}

/**
 *
 */
@Directive({
  selector: '[classes]',
})
export class NativeClassesDirective {
  @Input() classes: any[]

  constructor(public element: ElementRef) {
    onChange(this, 'classes', classes => {
      const enabledClasses = classes
        .map(item => {
          if (Array.isArray(item)) {
            return item[1] ? item[0] : null
          } else {
            return item
          }
        })
        .filter(t => t)

      this.element.nativeElement.classList.assign(enabledClasses)
    })
  }
}
