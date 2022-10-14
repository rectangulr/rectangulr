"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseKey = exports.parseKeys = exports.Key = void 0;
class Key {
    constructor() {
        this.shift = false;
        this.alt = false;
        this.ctrl = false;
        this.meta = false;
        this.name = null;
    }
}
exports.Key = Key;
function parseKeys(string) {
    let parts = string.split(/,/g);
    return parts.map(part => parseKey(part));
}
exports.parseKeys = parseKeys;
function parseKey(string) {
    let entry = new Key();
    let parts = string.split(/[+-]/g);
    for (let t = 0; t < parts.length; ++t) {
        let part = parts[t];
        if (t !== parts.length - 1) {
            switch (part.toLowerCase()) {
                case `shift`:
                case `s`:
                    {
                        entry.shift = true;
                    }
                    break;
                case `alt`:
                case `a`:
                    {
                        entry.alt = true;
                    }
                    break;
                case `ctrl`:
                case `c`:
                    {
                        entry.ctrl = true;
                    }
                    break;
                case `meta`:
                case `m`:
                    {
                        entry.meta = true;
                    }
                    break;
                default:
                    {
                        throw new Error(`Failed to parse shortcut descriptor: Invalid modifier "${part}".`);
                    }
                    break;
            }
        }
        else {
            entry.name = part;
        }
    }
    return entry;
}
exports.parseKey = parseKey;
