import { Inject, Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { makeObservable } from '../../../utils/reactivity'
import { Anything } from '../../../utils/utils'

/**
 * A service for switching to another view.
 */
@Injectable({
  providedIn: 'root',
})
export class ViewService {
  /**
   * All the views that the service can find from providers.
   */
  views: View[]

  /**
   * Only the views that should be shown as tabs.
   */
  tabs: View[]

  /**
   * The current tab that is selected at the botttom.
   */
  currentTab: View = null

  /**
   * The current tab as an observable.
   */
  $currentTab = new BehaviorSubject<View>(null)

  constructor(@Inject(View) views: View[]) {
    makeObservable(this, 'currentTab', '$currentTab')
    this.views = views.map(view => ({ tags: [], ...view }))
    this.tabs = this.views.filter(v => !v.tags.includes('hidden'))
    this.currentTab = this.tabs.find(v => v)
  }

  switchTo(viewName: string) {
    const view = this.tabs.find(v => v.name == viewName)
    if (!view) throw new Error(`couldnt find view: ${viewName}`)
    this.currentTab = view
  }

  nextView() {
    const currentIndex = this.tabs.indexOf(this.currentTab)
    let newIndex = currentIndex + 1
    if (newIndex > this.tabs.length - 1) {
      newIndex = 0
    }
    this.currentTab = this.tabs[newIndex]
  }
}

export abstract class View {
  name: string
  component: any
  tags: (string | Anything)[]
}
