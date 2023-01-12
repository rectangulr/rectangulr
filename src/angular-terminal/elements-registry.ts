import { TermElement } from './dom-terminal/sources/term/elements/TermElement'
import { TermText2 } from './dom-terminal/sources/term/elements/TermText2'

export const elementsFactory: Map<string, any> = new Map()
  .set('box', TermElement)
  .set('text', TermText2)
