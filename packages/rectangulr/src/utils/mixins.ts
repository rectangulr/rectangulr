/**
 * Mixins are a way of extending classes with additional functionality.
 * For more info: https://www.typescriptlang.org/docs/handbook/mixins.html#alternative-pattern
 */

/**
 * Copies the methods from the mixin class to the base class.
 * The constructor is not copied. It has to be called using 'extend'.
 */
export function extendClass(baseClass: any, mixinClasses: any[]) {
  mixinClasses.forEach(mixinClass => {
    Object.getOwnPropertyNames(mixinClass.prototype).forEach(propertyName => {
      if (propertyName == '_constructor' || propertyName == 'constructor') return
      const propertyDescriptor =
        Object.getOwnPropertyDescriptor(mixinClass.prototype, propertyName) || Object.create(null)
      Object.defineProperty(baseClass.prototype, propertyName, propertyDescriptor)
    })
  })
}

export function extendConstructor(baseClass, mixinClass, ...constructorArgs) {
  return mixinClass.prototype._constructor.call(baseClass, ...constructorArgs)
}

/**
 * We use '_constructor' instead of 'constructor' because
 * you can't call a class's constructor without the 'new' keyword.
 * But we don't want to use 'new' because we want to modify an existing object.
 */
export interface Mixin {
  _constructor?()
}

// /**
//  * A mixin class that provides a destroy$ observable that emits when the component is destroyed.
//  */
// @Directive()
// export class Destroyable {
//   destroy$: Subject<any>

//   _constructor?() {
//     this.destroy$ = new Subject()
//   }

//   ngOnDestroy() {
//     this.destroy$.next(null)
//     this.destroy$.complete()
//   }
// }

export interface Destroyable {
  destroy$: any
}
