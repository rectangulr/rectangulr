"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpecificity = void 0;
function getSpecificity(states) {
    let specificity = states.size;
    if (states.has(`decored`))
        specificity -= 1;
    return specificity;
}
exports.getSpecificity = getSpecificity;
