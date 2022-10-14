"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flags = void 0;
exports.flags = {
    ELEMENT_HAS_DIRTY_NODE_LIST: 1 << 0,
    ELEMENT_HAS_DIRTY_FOCUS_LIST: 1 << 1,
    ELEMENT_HAS_DIRTY_RENDER_LIST: 1 << 2,
    ELEMENT_HAS_DIRTY_LAYOUT: 1 << 3,
    ELEMENT_HAS_DIRTY_CLIPPING: 1 << 4,
    ELEMENT_HAS_DIRTY_LAYOUT_CHILDREN: 1 << 5,
    ELEMENT_HAS_DIRTY_CLIPPING_CHILDREN: 1 << 6,
    ELEMENT_IS_DIRTY: 1 << 0 && 1 << 1 && 1 << 2 && 1 << 3 && 1 << 4 && 1 << 5,
};
