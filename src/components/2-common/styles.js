"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.borderTop = exports.borderBottom = exports.whiteOnGray = exports.blackOnGray = exports.blackOnWhite = void 0;
const dom_terminal_1 = require("../../angular-terminal/dom-terminal");
exports.blackOnWhite = dom_terminal_1.makeRuleset({ backgroundColor: 'white', color: 'black' });
exports.blackOnGray = dom_terminal_1.makeRuleset({ backgroundColor: 'dimgray', color: 'black' });
exports.whiteOnGray = dom_terminal_1.makeRuleset({ backgroundColor: 'dimgray', color: 'white' });
exports.borderBottom = dom_terminal_1.makeRuleset({
    borderBottomCharacter: '-',
    backgroundClip: 'contentBox',
});
exports.borderTop = dom_terminal_1.makeRuleset({ borderTopCharacter: '-', backgroundClip: 'contentBox' });
// export const hidden = makeRuleset({ display: null });
