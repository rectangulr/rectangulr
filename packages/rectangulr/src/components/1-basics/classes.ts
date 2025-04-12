import { Directive, ElementRef, Input } from '@angular/core'
import { onChange } from '../../utils/reactivity'
import { assert } from '../../utils/Assert'

// /**
//  *
//  */
// @Directive({
//   standalone: true,
//   selector: '[newclasses]',
// })
// export class NewClassesDirective {
//   @Input() newclasses: (IStyle | [condition: boolean, style: IStyle])[]

//   constructor(public element: ElementRef) {
//     onChange(this, 'newclasses', (classes: IStyle[] | IStyle[]) => {
//       const enabledClasses = classes
//         .map(item => {
//           if (Array.isArray(item)) {
//             const [condition, style] = item
//             assert(typeof style == 'object')
//             return condition ? style : null
//           } else {
//             return item
//           }
//         })
//         .filter(t => t)

//       const newStyle = {}
//       enabledClasses.forEach(klass => {
//         Object.entries(klass).forEach(([key, value]) => {
//           newStyle[key] = value
//         })
//       })

//       this.element.nativeElement.style.assign(newStyle)
//     })
//   }
// }

// /**
//  *
//  */
// @Directive({
//   standalone: true,
//   selector: '[classes]',
// })
// export class ClassesDirective {
//   @Input() classes: any[]

//   constructor(public element: ElementRef) {
//     onChange(this, 'classes', classes => {
//       const enabledClasses = classes
//         .map(item => {
//           if (Array.isArray(item)) {
//             const [condition, style] = item
//             assert(typeof style == 'object')
//             return condition ? style : null
//           } else {
//             return item
//           }
//         })
//         .filter(t => t)

//       this.element.nativeElement.classList.assign(enabledClasses)
//     })
//   }
// }
