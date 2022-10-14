"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementsFactory = void 0;
const dom_terminal_1 = require("./dom-terminal");
exports.elementsFactory = new Map()
    .set('box', dom_terminal_1.TermElement)
    .set('text', dom_terminal_1.TermText2);
