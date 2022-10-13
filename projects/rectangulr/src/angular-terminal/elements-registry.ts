import { TermElement, TermText2 } from './dom-terminal'

export const elementsFactory: Map<string, any> = new Map()
  .set('box', TermElement)
  .set('text', TermText2)
