import { Inject, Injectable } from '@angular/core'
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs'
import { Command, CommandService, registerCommands } from '../../../commands/command_service'
import { makeObservable } from '../../../utils/reactivity'

/**
 * Allows to switch to another view.
 */
@Injectable({
  providedIn: 'root',
})
export class ViewService {
  currentView: View = this.views.find(v => v)
  $currentView = new BehaviorSubject<View>(null)

  commands: Partial<Command>[] = [
    {
      keys: 'alt+o',
      id: 'nextView',
      name: 'Next view',
      func: () => {
        this.nextView()
      },
    },
  ]

  constructor(public commandService: CommandService, @Inject(View) public views: View[]) {
    registerCommands(this, this.commands)
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

  destroy$ = new Subject()
  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}

export abstract class View {
  name: string
  component: any
}
