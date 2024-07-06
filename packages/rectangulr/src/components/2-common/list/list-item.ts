import { Directive, Input, Signal } from '@angular/core'
import { Observable } from 'rxjs'

@Directive({
  standalone: true,
  selector: '[item]',
})
export class ListItem<T> {
  @Input() itemType: T | T[] | Observable<T[]> | Signal<T[]>

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
