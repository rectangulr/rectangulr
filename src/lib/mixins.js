"use strict";
/**
 * Mixins are a way of extending classes with additional functionality.
 * For more info: https://www.typescriptlang.org/docs/handbook/mixins.html#alternative-pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendConstructor = exports.extendClass = void 0;
/**
 * Copies the methods from the mixin class to the base class.
 * The constructor is not copied. It has to be called using 'extend'.
 */
function extendClass(baseClass, mixinClasses) {
    mixinClasses.forEach((mixinClass) => {
        Object.getOwnPropertyNames(mixinClass.prototype).forEach((propertyName) => {
            if (propertyName == "_constructor" || propertyName == "constructor")
                return;
            const propertyDescriptor = Object.getOwnPropertyDescriptor(mixinClass.prototype, propertyName) ||
                Object.create(null);
            Object.defineProperty(baseClass.prototype, propertyName, propertyDescriptor);
        });
    });
}
exports.extendClass = extendClass;
function extendConstructor(baseClass, mixinClass, ...constructorArgs) {
    return mixinClass.prototype._constructor.call(baseClass, ...constructorArgs);
}
exports.extendConstructor = extendConstructor;
