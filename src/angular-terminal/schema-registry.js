"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalElementSchemaRegistry = void 0;
const compiler_1 = require("@angular/compiler");
const core_1 = require("@angular/core");
class TerminalElementSchemaRegistry extends compiler_1.ElementSchemaRegistry {
    hasProperty(_tagName, _propName) {
        switch (_propName) {
            case 'style':
            case 'classes':
                return true;
            default:
                return false;
        }
    }
    hasElement(_tagName, _schemaMetas) {
        switch (_tagName) {
            case 'div':
            case 'text':
            case 'comment':
                return true;
            default:
                return false;
        }
    }
    getMappedPropName(propName) {
        return propName;
    }
    getDefaultComponentElementName() {
        return 'ng-component';
    }
    securityContext(_tagName, _propName) {
        return core_1.SecurityContext.NONE;
    }
    validateProperty(_name) {
        return { error: false };
    }
    validateAttribute(_name) {
        return { error: false };
    }
    allKnownElementNames() {
        return [];
    }
    normalizeAnimationStyleProperty(propName) {
        return propName;
    }
    normalizeAnimationStyleValue(_camelCaseProp, _userProvidedProp, val) {
        return { error: null, value: val.toString() };
    }
}
exports.TerminalElementSchemaRegistry = TerminalElementSchemaRegistry;
