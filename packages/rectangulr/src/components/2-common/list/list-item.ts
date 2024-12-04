import { Directive, Signal, input } from '@angular/core'
import { Observable } from 'rxjs'

@Directive({
  standalone: true,
  selector: '[item]',
})
export class ListItem<T> {
  readonly itemType = input<T | T[] | Observable<T[]> | Signal<T[]>>(undefined)

  static ngTemplateContextGuard<T>(
    directive: ListItem<T>,
    context: any
  ): context is {
    $implicit: T
    index: number
    count: number
    first: boolean
    last: boolean
    even: boolean
    odd: boolean
    selected: boolean
  } {
    return true
  }
}
