import { Directive, Input } from '@angular/core'
import { Observable } from 'rxjs'

@Directive({
  selector: '[listItem]',
})
export class ListItem<T> {
  @Input() listItemType: T | T[] | Observable<T[]>

  static ngTemplateContextGuard<T>(
    directive: ListItem<T>,
    context: any
  ): context is { $implicit: T } {
    return true
  }
}
