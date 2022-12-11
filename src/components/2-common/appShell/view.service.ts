import { EventEmitter, Inject, Injectable } from '@angular/core'
import { BehaviorSubject, Subject } from 'rxjs'
import { makeObservable } from '../../../utils/reactivity'

/**
 * A service for switching to another view.
 */
@Injectable({
  providedIn: 'root',
})
export class ViewService {
  currentView: View = this.views.find(v => v)
  $currentView = new BehaviorSubject<View>(null)

  constructor(@Inject(View) public views: View[]) {
    makeObservable(this, 'currentView', '$currentView')
  }

  switchTo(viewName: string) {
    const view = this.views.find(v => v.name == viewName)
    if (!view) throw new Error(`couldnt find view: ${viewName}`)
    this.currentView = view
  }

  nextView() {
    const currentIndex = this.views.indexOf(this.currentView)
    let newIndex = currentIndex + 1
    if (newIndex > this.views.length - 1) {
      newIndex = 0
    }
    this.currentView = this.views[newIndex]
  }
}

export abstract class View {
  name: string
  component: any
}
