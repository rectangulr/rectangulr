"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalSanitizer = void 0;
const core_1 = require("@angular/core");
class TerminalSanitizer extends core_1.Sanitizer {
    sanitize(context, value) {
        return value;
    }
}
exports.TerminalSanitizer = TerminalSanitizer;
