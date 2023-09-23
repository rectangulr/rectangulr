import { Inject, Injectable, Signal, WritableSignal, computed, signal } from '@angular/core'
import { Anything, assert } from '../../../utils/utils'

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
  views: WritableSignal<View[]>

  /**
   * Only the views that should be shown as tabs.
   */
  visibleViews: Signal<View[]>

  /**
   * The current tab that is selected at the botttom.
   */
  currentTab: WritableSignal<View>

  constructor(@Inject(View) public injectedViews: View[]) {
    this.views = signal(injectedViews.map(view => ({ tags: [], ...view })))
    this.currentTab = signal(this.views().find(v => !v.tags.includes('hidden')))
    this.visibleViews = computed(() => {
      const visibleViews = this.views().filter(v => !v.tags.includes('hidden'))
      if (!visibleViews.includes(this.currentTab())) {
        if (!this.currentTab()) debugger
        visibleViews.push(this.currentTab())
      }
      return visibleViews
    })
  }

  switchTo(viewName: string) {
    const view = this.views().find(v => v.name == viewName)
    if (!view) throw new Error(`couldnt find view: ${viewName}`)
    assert(view)
    this.currentTab.set(view)
  }

  nextView() {
    const currentIndex = this.visibleViews().indexOf(this.currentTab())
    let newIndex = currentIndex + 1
    if (newIndex > this.visibleViews().length - 1) {
      newIndex = 0
    }
    assert(this.visibleViews()[newIndex])
    this.currentTab.set(this.visibleViews()[newIndex])
  }
}

export abstract class View {
  name: string
  component: any
  tags: (string | Anything)[]
}
