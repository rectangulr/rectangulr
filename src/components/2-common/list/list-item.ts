import { Directive, Input } from '@angular/core'
import { Observable } from 'rxjs'

@Directive({
  selector: '[item]',
})
export class ListItem<T> {
  @Input() itemType: T | T[] | Observable<T[]>

  static ngTemplateContextGuard<T>(
    directive: ListItem<T>,
    context: any
  ): context is { $implicit: T } {
    return true
  }
}
