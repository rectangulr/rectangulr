import { closest as closestColor } from 'color-diff'

import colors from '../data/colorNames.compiled.json'
import palettes from '../data/colorPalettes.compiled.json'
import { doesSupport16Colors, doesSupport256Colors, doesSupportTrueColors } from '../support'

const colorNames = colors.colorNames
const palette16 = palettes.palette16
const palette256 = palettes.palette256

export type ColorName = keyof typeof colorNames

export enum Target {
  Foreground = 0,
  Background = 10,
  Clear,
}

// Needs to be R,G,B rather than r,g,b for
// compat with color-diff
export type RGB = {
  R: number
  G: number
  B: number
}

const hexShortExp = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i
const hexRegExp = /^#([0-9a-f]{6})$/i

export function hexToRgb(hex: string): RGB {
  const match = hex
    .replace(hexShortExp, `#$1$1$2$2$3$3`)
    .match(hexRegExp)

  if (!match)
    throw new Error(`Invalid color (${hex})`)

  const color = parseInt(match[1], 16)

  const r = (color & 0xFF0000) >>> 16
  const g = (color & 0x00FF00) >>> 8
  const b = (color & 0x0000FF) >>> 0

  return { R: r, G: g, B: b }
}

function getClosestColor(color: RGB, target: Array<RGB>) {
  return target.indexOf(closestColor(color, target))
}

export function getClosestColor16(color: RGB) {
  return getClosestColor(color, palette16)
}

export function getClosestColor256(color: RGB) {
  return getClosestColor(color, palette256)
}

export function getTrueColorSequence(color: RGB, target: Target) {
  return `\x1b[${38 + target};2;${color.R};${color.G};${color.B}m`
}

export function get256ColorsSequence(index: number, target: Target) {
  return `\x1b[${38 + target};5;${index}m`
}

export function get16ColorsSequence(index: number, target: Target) {
  return `\x1b[${(index < 8 ? 30 : 90 - 8) + target + index}m`
}

function memo<TArg, TRet>(fn: (arg: TArg) => TRet) {
  const cache = new Map<TArg, TRet>()

  return (arg: TArg) => {
    let entry = cache.get(arg)

    if (typeof entry === `undefined`)
      cache.set(arg, entry = fn(arg))

    return entry
  }
}

export const hexToRgbMemo = memo(hexToRgb)
export const hexTo256ColorsMemo = memo((color: string) => getClosestColor256(hexToRgb(color)))
export const hexTo16ColorsMemo = memo((color: string) => getClosestColor256(hexToRgb(color)))

export function getHexColorSequence(color: string, target: Target): string {
  if (doesSupportTrueColors) {
    return getTrueColorSequence(hexToRgbMemo(color), target)
  }
  if (doesSupport256Colors) {
    return get256ColorsSequence(hexTo256ColorsMemo(color), target)
  }
  if (doesSupport16Colors) {
    return get16ColorsSequence(hexTo16ColorsMemo(color), target)
  }
  return ''
}

export function getNamedColorSequence(name: ColorName, target: Target): string {
  if (doesSupportTrueColors) {
    return getTrueColorSequence(colorNames[name].rgb, target)
  }
  if (doesSupport256Colors) {
    return get256ColorsSequence(colorNames[name].c256, target)
  }
  if (doesSupport16Colors) {
    return get16ColorsSequence(colorNames[name].c16, target)
  }
  return ''
}

export function resolveColorToRgb(color: ColorName | string) {
  if (Object.prototype.hasOwnProperty.call(colorNames, color)) {
    return colorNames[color as ColorName].rgb
  }
  return hexToRgbMemo(color)
}

export function getColorSequence(color: ColorName | string, target: Target) {
  if (Object.prototype.hasOwnProperty.call(colorNames, color)) {
    return getNamedColorSequence(color as ColorName, target)
  }
  return getHexColorSequence(color, target)
}

export function getColorResetSequence(target: Target) {
  if (doesSupportTrueColors || doesSupport256Colors || doesSupport16Colors) {
    return `\x1b[${39 + target}m`
  }
  return ''
}
