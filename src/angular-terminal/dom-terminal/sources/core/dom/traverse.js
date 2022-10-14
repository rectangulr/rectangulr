"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChildOf = exports.findDescendantsByPredicate = exports.findDescendantByPredicate = exports.findAncestorsByPredicate = exports.findAncestorByPredicate = void 0;
function findAncestorByPredicate(node, predicate) {
    for (node = node && node.parentNode; node; node = node.parentNode)
        if (predicate(node))
            return node;
    return null;
}
exports.findAncestorByPredicate = findAncestorByPredicate;
function findAncestorsByPredicate(node, predicate) {
    let match = [];
    for (node = node && node.parentNode; node; node = node.parentNode)
        if (predicate(node))
            match.push(node);
    return match;
}
exports.findAncestorsByPredicate = findAncestorsByPredicate;
function findDescendantByPredicate(node, predicate) {
    if (node) {
        let children = node.childNodes.slice();
        while (children.length > 0) {
            let child = children.shift();
            if (predicate(child))
                return child;
            children.splice(0, 0, ...child.childNodes);
        }
    }
    return null;
}
exports.findDescendantByPredicate = findDescendantByPredicate;
function findDescendantsByPredicate(node, predicate) {
    let match = [];
    if (node) {
        let children = node.childNodes.slice();
        while (children.length > 0) {
            let child = children.shift();
            if (predicate(child))
                match.push(child);
            children.splice(0, 0, ...child.childNodes);
        }
    }
    return match;
}
exports.findDescendantsByPredicate = findDescendantsByPredicate;
function isChildOf(node, parent) {
    if (node === null)
        return false;
    for (node = node.parentNode; node; node = node.parentNode)
        if (node === parent)
            return true;
    return false;
}
exports.isChildOf = isChildOf;
