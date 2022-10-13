import { makeRuleset } from '../../angular-terminal/dom-terminal'

export const blackOnWhite = makeRuleset({ backgroundColor: 'white', color: 'black' })
export const blackOnGray = makeRuleset({ backgroundColor: 'dimgray', color: 'black' })
export const whiteOnGray = makeRuleset({ backgroundColor: 'dimgray', color: 'white' })

export const borderBottom = makeRuleset({
  borderBottomCharacter: '-',
  backgroundClip: 'contentBox',
})
export const borderTop = makeRuleset({ borderTopCharacter: '-', backgroundClip: 'contentBox' })

// export const hidden = makeRuleset({ display: null });
